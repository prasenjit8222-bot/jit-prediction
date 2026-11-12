/**
 * Vercel Serverless Function: /api/yahoo
 * Server-side Yahoo Finance proxy for Indian Stock Market indices (^NSEI, ^NSEBANK).
 * Bypasses browser CORS restrictions with proper User-Agent headers.
 */

export default async function handler(req: any, res: any) {
  // 1. CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2. Query parameters
  const symbol = (req.query?.symbol as string) || '^NSEI';
  const interval = (req.query?.interval as string) || '5m';
  const range = (req.query?.range as string) || '1d';

  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

  const endpoints = [
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`,
    `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`
  ];

  for (const url of endpoints) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://finance.yahoo.com'
        }
      });

      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      if (data?.chart?.result && data.chart.result.length > 0) {
        res.setHeader('Cache-Control', 'public, max-age=5, s-maxage=5, stale-while-revalidate=10');
        return res.status(200).json(data);
      }
    } catch {
      // Try next endpoint
      continue;
    }
  }

  return res.status(502).json({
    error: 'Failed to fetch live market data from Yahoo Finance servers',
    symbol,
    timestamp: Date.now()
  });
}
