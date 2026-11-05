/**
 * JIT PREDICTION - Full Stack Server
 * Express + WebSocket + Gemini Live API + Vite Dev Middleware / Production Static Server
 */
import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';
import { apiRouter } from './server/routes.ts';
import { fetchNseIndexCandles, getIndianMarketStatus } from './server/marketEngine.ts';
import { createLiveApiSession } from './server/geminiService.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const isProd = process.env.NODE_ENV === 'production';

// Port resolution:
// 1. CLI argument `--port <port>` (passed by dev supervisor: e.g. --port 3000)
// 2. In development (!isProd): strictly use 3000 as required by the AI Studio preview environment
// 3. In production: use process.env.PORT (defaults to 8080 in Cloud Run)
const cliPortIndex = process.argv.indexOf('--port');
const cliPort = cliPortIndex !== -1 && process.argv[cliPortIndex + 1] ? Number(process.argv[cliPortIndex + 1]) : null;
const PORT = cliPort || (!isProd ? 3000 : (Number(process.env.PORT) || 8080));
const server = http.createServer(app);

// CORS & Security headers for web and Android WebView
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());
app.use(express.static(path.resolve(__dirname, 'public')));

// Direct APK download route
app.get('/download/JIT_PREDICTION_Universal.apk', (req, res) => {
  res.download(path.resolve(__dirname, 'public/downloads/JIT_PREDICTION_Universal.apk'), 'JIT_PREDICTION_Universal.apk');
});

// API Routes
app.use('/api', apiRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'JIT PREDICTION Market Engine',
    timestamp: new Date().toISOString(),
    marketStatus: getIndianMarketStatus().sessionState
  });
});

// WebSocket Servers:
// 1. /ws -> Real-time Indian market data updates
// 2. /live -> Server-Side Gemini Live API voice & real-time interaction
const wss = new WebSocketServer({ noServer: true });
const liveWss = new WebSocketServer({ noServer: true });

wss.on('connection', (ws: WebSocket) => {
  // Send initial welcome & market status
  ws.send(JSON.stringify({
    type: 'CONNECTED',
    message: 'Connected to JIT PREDICTION real-time Indian market stream',
    marketStatus: getIndianMarketStatus(),
    timestamp: Date.now()
  }));

  // Handle client subscriptions
  ws.on('message', async (message: string) => {
    try {
      const parsed = JSON.parse(message.toString());
      if (parsed.type === 'SUBSCRIBE') {
        const symbol = parsed.symbol || '^NSEI';
        const timeframe = parsed.timeframe || '5m';
        try {
          const data = await fetchNseIndexCandles(symbol, timeframe);
          ws.send(JSON.stringify({
            type: 'MARKET_TICK',
            symbol,
            meta: data.meta,
            lastCandle: data.candles[data.candles.length - 1]
          }));
        } catch {
          // silently handle
        }
      }
    } catch {
      // ignore malformed ws messages
    }
  });
});

liveWss.on('connection', async (clientWs: WebSocket) => {
  try {
    const session = await createLiveApiSession({
      onAudioChunk: (audioBase64) => {
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({ audio: audioBase64 }));
        }
      },
      onTranscript: (text) => {
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({ transcript: text }));
        }
      },
      onInterrupted: () => {
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({ interrupted: true }));
        }
      }
    });

    clientWs.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.audio) {
          session.sendRealtimeInput({
            audio: { data: msg.audio, mimeType: 'audio/pcm;rate=16000' }
          });
        }
      } catch {
        // ignore invalid audio payload
      }
    });

    clientWs.on('close', () => {
      try { session.close(); } catch {}
    });
  } catch (err: any) {
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ error: 'Live API session unavailable', details: err?.message }));
      clientWs.close();
    }
  }
});

server.on('upgrade', (request, socket, head) => {
  try {
    const pathname = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`).pathname;
    if (pathname === '/live') {
      liveWss.handleUpgrade(request, socket, head, (ws) => {
        liveWss.emit('connection', ws, request);
      });
    } else {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  } catch {
    socket.destroy();
  }
});

// Broadcast periodic market tick to connected clients every 5 seconds
setInterval(async () => {
  if (wss.clients.size === 0) return;
  try {
    const marketStatus = getIndianMarketStatus();
    const [nifty, bankNifty] = await Promise.all([
      fetchNseIndexCandles('^NSEI', '5m').catch(() => null),
      fetchNseIndexCandles('^NSEBANK', '5m').catch(() => null)
    ]);

    const payload = JSON.stringify({
      type: 'TICK_BROADCAST',
      timestamp: Date.now(),
      marketStatus,
      quotes: {
        nifty50: nifty?.meta,
        bankNifty: bankNifty?.meta
      }
    });

    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  } catch {
    // broadcast resilience
  }
}, 5000);

// Vite Middleware for Dev / Static Files for Prod
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Serve static assets: content-hashed assets in /assets are cached, HTML and sw.js are strictly never cached
    app.use('/assets', express.static(path.resolve(__dirname, 'dist', 'assets'), {
      maxAge: '1y',
      immutable: true
    }));
    app.use(express.static(path.resolve(__dirname, 'dist'), {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html') || filePath.endsWith('sw.js')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        }
      }
    }));
    app.get('*', (req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Please wait for previous process to release.`);
    } else {
      console.error('Server error:', err);
    }
  });

  server.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 JIT PREDICTION server active on http://0.0.0.0:${PORT}`);
  });
}

const shutdown = () => {
  try {
    wss.close();
    liveWss.close();
    server.close(() => {
      process.exit(0);
    });
    setTimeout(() => process.exit(0), 1000).unref();
  } catch {
    process.exit(0);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

startServer();
