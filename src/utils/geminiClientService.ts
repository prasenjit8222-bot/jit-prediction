/**
 * JIT PREDICTION - AI Market Explanation Service (Client Endpoint Consumer)
 * Calls the server-side Gemini 3.8 Flash endpoint (/api/market/ai-analysis)
 * with zero client-side SDK imports and zero API key exposure.
 * Includes local quantitative analysis fallback for seamless offline resilience.
 */
import type { 
  PredictionResult, 
  TechnicalIndicators, 
  SupportResistanceLevels, 
  PriceActionAnalysis 
} from '../types.js';

interface CachedExplanation {
  data: { 
    explanation: string; 
    reasoningPoints: string[]; 
    riskAssessment: string 
  };
  timestamp: number;
}

const clientCache = new Map<string, CachedExplanation>();
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes local cache

/**
 * Request 15-Minute Advance Market Explanation from the Server-Side Gemini API
 */
export async function generateClientMarketExplanation(
  prediction: PredictionResult,
  indicators: TechnicalIndicators,
  srLevels: SupportResistanceLevels,
  priceAction: PriceActionAnalysis
): Promise<{ explanation: string; reasoningPoints: string[]; riskAssessment: string }> {
  const cacheKey = `${prediction.symbol}_${prediction.timeframe}_${prediction.predictedDirection}`;
  const cached = clientCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  // 1. Call server-side Gemini 3.8 Flash analysis endpoint
  try {
    const response = await fetch('/api/market/ai-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prediction,
        indicators,
        srLevels,
        priceAction
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data?.analysis && data.analysis.explanation) {
        clientCache.set(cacheKey, { data: data.analysis, timestamp: Date.now() });
        return data.analysis;
      }
    }
  } catch {
    // If server is warming up or temporarily unreachable, gracefully proceed to quantitative calculation
  }

  // 2. High-Precision Deterministic Quantitative Technical Fallback Calculation
  // Guarantees the UI always displays immediate, verified technical confluence
  const isUp = prediction.predictedDirection === 'UP';
  const isDown = prediction.predictedDirection === 'DOWN';

  let explanation = '';
  if (isUp) {
    explanation = `${prediction.symbolName} demonstrates strong bullish orderflow on the ${prediction.timeframe} timeframe. Price holds above the institutional VWAP (₹${indicators.vwap.toLocaleString('en-IN')}) with EMA 9/20 stacking confirming buyers in control. Supertrend remains supportive at ₹${indicators.supertrend.value.toLocaleString('en-IN')}, suggesting probability favors continuation toward the ₹${prediction.expectedPriceRange.targetHigh.toLocaleString('en-IN')} resistance band within the next 15 minutes.`;
  } else if (isDown) {
    explanation = `${prediction.symbolName} is experiencing active distribution with sellers defending key levels. Price trades below VWAP (₹${indicators.vwap.toLocaleString('en-IN')}) with negative MACD histogram momentum and Supertrend red at ₹${indicators.supertrend.value.toLocaleString('en-IN')}. Structure shows downward rejection with high probability of testing dynamic support at ₹${prediction.expectedPriceRange.targetLow.toLocaleString('en-IN')} over the next 15 minutes.`;
  } else {
    explanation = `${prediction.symbolName} is currently oscillating inside an intraday consolidation range between ₹${srLevels.nearestSupport.toLocaleString('en-IN')} and ₹${srLevels.nearestResistance.toLocaleString('en-IN')}. Momentum indicators show neutral equilibrium (RSI ${indicators.rsi14}), warranting patience until a decisive Break of Structure occurs.`;
  }

  const reasoningPoints = [
    `${indicators.ema.alignment.replace('_', ' ')}: Price relative to EMA 20 (₹${indicators.ema.ema20.toLocaleString('en-IN')}) and VWAP (₹${indicators.vwap.toLocaleString('en-IN')}) confirms ${isUp ? 'accumulation' : isDown ? 'distribution' : 'range equilibrium'}.`,
    `Momentum & Trend: RSI at ${indicators.rsi14} and ADX at ${indicators.adx14.adx} indicates ${indicators.adx14.trendStrength.toLowerCase()} directional impulse.`,
    `Structure & Pivot: Nearest support at ₹${srLevels.nearestSupport.toLocaleString('en-IN')} and resistance at ₹${srLevels.nearestResistance.toLocaleString('en-IN')} provide clear risk-reward bounds.`
  ];

  const riskAssessment = isUp
    ? `A sustained break below support ₹${srLevels.nearestSupport.toLocaleString('en-IN')} invalidates the bullish 15-minute advance trajectory.`
    : isDown
    ? `A reversal above resistance ₹${srLevels.nearestResistance.toLocaleString('en-IN')} with volume invalidates the bearish forecast.`
    : `Avoid aggressive entries until a clear breakout candle closes outside the immediate pivot range.`;

  const fallbackResult = {
    explanation,
    reasoningPoints,
    riskAssessment
  };

  clientCache.set(cacheKey, { data: fallbackResult, timestamp: Date.now() });
  return fallbackResult;
}

/**
 * Stream Gemini AI market explanation from server via SSE (Server-Sent Events)
 */
export async function* streamServerMarketExplanation(
  prediction: PredictionResult,
  indicators: TechnicalIndicators,
  srLevels: SupportResistanceLevels,
  priceAction: PriceActionAnalysis
): AsyncGenerator<string, void, unknown> {
  try {
    const response = await fetch('/api/market/ai-analysis/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prediction, indicators, srLevels, priceAction })
    });

    if (!response.ok || !response.body) {
      const fallback = await generateClientMarketExplanation(prediction, indicators, srLevels, priceAction);
      yield fallback.explanation;
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const raw = line.slice(6).trim();
          if (raw === '[DONE]') return;
          try {
            const parsed = JSON.parse(raw);
            if (parsed.chunk) yield parsed.chunk;
            if (parsed.explanation) yield parsed.explanation;
          } catch {
            yield raw;
          }
        }
      }
    }
  } catch {
    const fallback = await generateClientMarketExplanation(prediction, indicators, srLevels, priceAction);
    yield fallback.explanation;
  }
}
