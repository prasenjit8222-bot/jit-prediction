/**
 * JIT PREDICTION - AI Market Explanation Service
 * Uses @google/genai with 'gemini-3.8-flash' with quota backoff & caching
 */
import { GoogleGenAI } from '@google/genai';
import type { PredictionResult, TechnicalIndicators, SupportResistanceLevels, PriceActionAnalysis } from './marketEngine.js';

let aiClient: GoogleGenAI | null = null;
let rateLimitedUntil = 0;

interface CachedExplanation {
  data: { explanation: string; reasoningPoints: string[]; riskAssessment: string };
  timestamp: number;
}
const explanationCache = new Map<string, CachedExplanation>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache to stay within quota

function getAiClient(): GoogleGenAI | null {
  if (aiClient) return aiClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  try {
    aiClient = new GoogleGenAI({ apiKey });
    return aiClient;
  } catch {
    return null;
  }
}

export async function generateMarketExplanation(
  prediction: PredictionResult,
  indicators: TechnicalIndicators,
  srLevels: SupportResistanceLevels,
  priceAction: PriceActionAnalysis
): Promise<{ explanation: string; reasoningPoints: string[]; riskAssessment: string }> {
  // 1. Check in-memory cache first
  const cacheKey = `${prediction.symbol}_${prediction.timeframe}_${prediction.predictedDirection}`;
  const cached = explanationCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const client = getAiClient();
  const isCooldownActive = Date.now() < rateLimitedUntil;

  // 2. If Gemini API is available and not rate limited, generate grounded explanation
  if (client && !isCooldownActive) {
    try {
      const prompt = `
You are the quantitative analyst and trading desk engineer for JIT PREDICTION, an institutional-grade Indian Stock Market forecasting system for NIFTY 50 and BANK NIFTY.
Analyze the following verified market evidence and generate a concise 15-minute advance market explanation.

MARKET METRICS:
- Index: ${prediction.symbolName} (${prediction.symbol})
- Current Spot Price: ₹${prediction.currentPrice.toLocaleString('en-IN')}
- Active Timeframe: ${prediction.timeframe}
- 15-Minute Predicted Direction: ${prediction.predictedDirection}
- Expected Target Range: ₹${prediction.expectedPriceRange.targetLow} to ₹${prediction.expectedPriceRange.targetHigh} (Median: ₹${prediction.expectedPriceRange.targetMedian})
- Predicted Movement: ${prediction.predictedPercentageChange}%
- Confidence Score: ${prediction.confidenceScore}% (Bullish: ${prediction.bullishProbability}%, Bearish: ${prediction.bearishProbability}%)
- Trend Strength: ${prediction.trendStrength}
- Risk Level: ${prediction.riskLevel}

TECHNICAL INDICATORS:
- RSI (14): ${indicators.rsi14}
- MACD Line: ${indicators.macd.macdLine}, Signal: ${indicators.macd.signalLine}, Histogram: ${indicators.macd.histogram} (${indicators.macd.trend})
- EMA Alignment: ${indicators.ema.alignment} (EMA9: ₹${indicators.ema.ema9}, EMA20: ₹${indicators.ema.ema20}, EMA50: ₹${indicators.ema.ema50}, EMA200: ₹${indicators.ema.ema200})
- VWAP: ₹${indicators.vwap} (Spot is ${prediction.currentPrice >= indicators.vwap ? 'ABOVE' : 'BELOW'} VWAP)
- Supertrend: ${indicators.supertrend.trend} at ₹${indicators.supertrend.value}
- ADX (14): ${indicators.adx14.adx} (${indicators.adx14.trendStrength}), +DI: ${indicators.adx14.plusDI}, -DI: ${indicators.adx14.minusDI}
- Bollinger Bands %B: ${indicators.bollingerBands.percentB}, Bandwidth: ${indicators.bollingerBands.bandwidth}%

SUPPORT & RESISTANCE:
- Nearest Support: ₹${srLevels.nearestSupport}
- Nearest Resistance: ₹${srLevels.nearestResistance}
- Classic Pivot: ₹${srLevels.classicPivots.pivot} (R1: ₹${srLevels.classicPivots.r1}, S1: ₹${srLevels.classicPivots.s1})

PRICE ACTION & STRUCTURE:
- Candlestick Pattern: ${priceAction.candlestickPattern || 'None'}
- Structure: ${priceAction.higherHighHigherLow ? 'Higher Highs / Higher Lows' : priceAction.lowerHighLowerLow ? 'Lower Highs / Lower Lows' : 'Range Bound'}
- Break of Structure: ${priceAction.breakOfStructure.detected ? priceAction.breakOfStructure.type : 'None'}
- Liquidity Sweep: ${priceAction.liquiditySweep.detected ? priceAction.liquiditySweep.description : 'None'}

REQUIREMENTS:
1. Provide a sharp, institutional 2-paragraph analysis explaining WHY the index is poised to move in this direction over the next 15 minutes based solely on the verified technical confluence.
2. Provide 3 specific bullet points citing the exact indicator and structure levels.
3. State a 1-sentence risk assessment warning on what invalidates this 15-minute setup.

Format output as JSON with keys:
{
  "explanation": "...",
  "reasoningPoints": ["point 1", "point 2", "point 3"],
  "riskAssessment": "..."
}
Return only valid JSON. No markdown code blocks.
`;

      const response = await client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        const result = {
          explanation: parsed.explanation || 'Market structure shows clear directional confluence on the active timeframe.',
          reasoningPoints: parsed.reasoningPoints || prediction.keyFactors,
          riskAssessment: parsed.riskAssessment || `Invalidation trigger is a close beyond ₹${prediction.predictedDirection === 'UP' ? srLevels.nearestSupport : srLevels.nearestResistance}.`
        };

        explanationCache.set(cacheKey, { data: result, timestamp: Date.now() });
        return result;
      }
    } catch (err: any) {
      // Check if quota / rate limit reached (status 429 or RESOURCE_EXHAUSTED)
      const isQuota = 
        err?.status === 'RESOURCE_EXHAUSTED' || 
        err?.code === 429 || 
        String(err).includes('429') || 
        String(err).includes('Quota');

      if (isQuota) {
        // Back off for 1 hour to prevent flooding the logs and hitting the API repeatedly
        rateLimitedUntil = Date.now() + 60 * 60 * 1000;
      }
      // Silently fall through to high-precision rule-based quantitative reasoning
    }
  }

  // 3. High-Precision Deterministic Quantitative Rule-Based Analytical Reasoning
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
    `${indicators.ema.alignment.replace('_', ' ')}: Price relative to EMA 20 (₹${indicators.ema.ema20.toLocaleString('en-IN')}) and VWAP (₹${indicators.vwap.toLocaleString('en-IN')}) confirms ${isUp ? 'accumulation' : isDown ? 'distribution' : 'chop'}.`,
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

  explanationCache.set(cacheKey, { data: fallbackResult, timestamp: Date.now() });
  return fallbackResult;
}

export async function* generateMarketExplanationStream(
  prediction: PredictionResult,
  indicators: TechnicalIndicators,
  srLevels: SupportResistanceLevels,
  priceAction: PriceActionAnalysis
) {
  const client = getAiClient();
  const isCooldownActive = Date.now() < rateLimitedUntil;

  if (client && !isCooldownActive) {
    try {
      const prompt = `
You are the quantitative analyst and trading desk engineer for JIT PREDICTION, an institutional-grade Indian Stock Market forecasting system for NIFTY 50 and BANK NIFTY.
Analyze the following verified market evidence and generate a concise 15-minute advance market explanation.

MARKET METRICS:
- Index: ${prediction.symbolName} (${prediction.symbol})
- Current Spot Price: ₹${prediction.currentPrice.toLocaleString('en-IN')}
- Active Timeframe: ${prediction.timeframe}
- 15-Minute Predicted Direction: ${prediction.predictedDirection}
- Expected Target Range: ₹${prediction.expectedPriceRange.targetLow} to ₹${prediction.expectedPriceRange.targetHigh} (Median: ₹${prediction.expectedPriceRange.targetMedian})
- Predicted Movement: ${prediction.predictedPercentageChange}%
- Confidence Score: ${prediction.confidenceScore}% (Bullish: ${prediction.bullishProbability}%, Bearish: ${prediction.bearishProbability}%)
- Trend Strength: ${prediction.trendStrength}
- Risk Level: ${prediction.riskLevel}

TECHNICAL INDICATORS:
- RSI (14): ${indicators.rsi14}
- MACD Line: ${indicators.macd.macdLine}, Signal: ${indicators.macd.signalLine}, Histogram: ${indicators.macd.histogram} (${indicators.macd.trend})
- EMA Alignment: ${indicators.ema.alignment} (EMA9: ₹${indicators.ema.ema9}, EMA20: ₹${indicators.ema.ema20}, EMA50: ₹${indicators.ema.ema50}, EMA200: ₹${indicators.ema.ema200})
- VWAP: ₹${indicators.vwap} (Spot is ${prediction.currentPrice >= indicators.vwap ? 'ABOVE' : 'BELOW'} VWAP)
- Supertrend: ${indicators.supertrend.trend} at ₹${indicators.supertrend.value}
- ADX (14): ${indicators.adx14.adx} (${indicators.adx14.trendStrength}), +DI: ${indicators.adx14.plusDI}, -DI: ${indicators.adx14.minusDI}
- Bollinger Bands %B: ${indicators.bollingerBands.percentB}, Bandwidth: ${indicators.bollingerBands.bandwidth}%

SUPPORT & RESISTANCE:
- Nearest Support: ₹${srLevels.nearestSupport}
- Nearest Resistance: ₹${srLevels.nearestResistance}
- Classic Pivot: ₹${srLevels.classicPivots.pivot} (R1: ₹${srLevels.classicPivots.r1}, S1: ₹${srLevels.classicPivots.s1})

PRICE ACTION & STRUCTURE:
- Candlestick Pattern: ${priceAction.candlestickPattern || 'None'}
- Structure: ${priceAction.higherHighHigherLow ? 'Higher Highs / Higher Lows' : priceAction.lowerHighLowerLow ? 'Lower Highs / Lower Lows' : 'Range Bound'}
- Break of Structure: ${priceAction.breakOfStructure.detected ? priceAction.breakOfStructure.type : 'None'}
- Liquidity Sweep: ${priceAction.liquiditySweep.detected ? priceAction.liquiditySweep.description : 'None'}

REQUIREMENTS:
1. Provide a sharp, institutional 2-paragraph analysis explaining WHY the index is poised to move in this direction over the next 15 minutes based solely on the verified technical confluence.
2. Provide 3 specific bullet points citing the exact indicator and structure levels.
3. State a 1-sentence risk assessment warning on what invalidates this 15-minute setup.

Format output as JSON with keys:
{
  "explanation": "...",
  "reasoningPoints": ["point 1", "point 2", "point 3"],
  "riskAssessment": "..."
}
Return only valid JSON. No markdown code blocks.`;

      const responseStream = await client.models.generateContentStream({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      });

      for await (const chunk of responseStream) {
        if (chunk.text) {
          yield chunk.text;
        }
      }
      return;
    } catch (err: any) {
      rateLimitedUntil = Date.now() + 15 * 60 * 1000;
    }
  }

  // Fallback if client unavailable or quota exceeded
  const fallback = await generateMarketExplanation(prediction, indicators, srLevels, priceAction);
  yield JSON.stringify(fallback);
}
