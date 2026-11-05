/**
 * JIT PREDICTION - Shared Data Types
 */

export interface Candle {
  timestamp: number;
  timeStr: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicators {
  rsi14: number;
  macd: {
    macdLine: number;
    signalLine: number;
    histogram: number;
    trend: 'BULLISH_CROSS' | 'BEARISH_CROSS' | 'BULLISH' | 'BEARISH';
  };
  ema: {
    ema9: number;
    ema20: number;
    ema50: number;
    ema200: number;
    alignment: 'STRONG_BULLISH' | 'BULLISH' | 'BEARISH' | 'STRONG_BEARISH' | 'MIXED';
  };
  vwap: number;
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
    percentB: number;
    bandwidth: number;
  };
  atr14: number;
  adx14: {
    adx: number;
    plusDI: number;
    minusDI: number;
    trendStrength: 'STRONG' | 'MODERATE' | 'WEAK';
  };
  supertrend: {
    value: number;
    trend: 'BULLISH' | 'BEARISH';
  };
}

export interface SupportResistanceLevels {
  previousDayHigh: number;
  previousDayLow: number;
  previousDayClose: number;
  intradayHigh: number;
  intradayLow: number;
  classicPivots: {
    pivot: number;
    r1: number;
    r2: number;
    r3: number;
    s1: number;
    s2: number;
    s3: number;
  };
  fibonacciPivots: {
    pivot: number;
    r1: number;
    r2: number;
    r3: number;
    s1: number;
    s2: number;
    s3: number;
  };
  dynamicSupport: number[];
  dynamicResistance: number[];
  nearestSupport: number;
  nearestResistance: number;
}

export interface PriceActionAnalysis {
  candlestickPattern: string | null;
  patternType: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  higherHighHigherLow: boolean;
  lowerHighLowerLow: boolean;
  breakOfStructure: {
    detected: boolean;
    type: 'BULLISH_BOS' | 'BEARISH_BOS' | null;
    level: number;
  };
  changeOfCharacter: {
    detected: boolean;
    type: 'BULLISH_CHOCH' | 'BEARISH_CHOCH' | null;
    level: number;
  };
  liquiditySweep: {
    detected: boolean;
    description: string | null;
  };
  fakeBreakout: {
    detected: boolean;
    description: string | null;
  };
  summary: string;
}

export interface ProjectedCandle {
  timestamp: number;
  timeStr: string;
  projectedOpen: number;
  projectedHigh: number;
  projectedLow: number;
  projectedClose: number;
  upperConfidenceBound: number;
  lowerConfidenceBound: number;
}

export interface PredictionResult {
  id: string;
  symbol: '^NSEI' | '^NSEBANK';
  symbolName: 'NIFTY 50' | 'BANK NIFTY';
  generatedAt: number;
  expiresAt: number;
  currentPrice: number;
  timeframe: string;
  predictedDirection: 'UP' | 'DOWN' | 'SIDEWAYS' | 'NO CLEAR SIGNAL';
  expectedPriceRange: {
    targetHigh: number;
    targetLow: number;
    targetMedian: number;
  };
  predictedPercentageChange: number;
  confidenceScore: number;
  bullishProbability: number;
  bearishProbability: number;
  sidewaysProbability: number;
  trendStrength: 'STRONG_BULLISH' | 'WEAK_BULLISH' | 'SIDEWAYS' | 'WEAK_BEARISH' | 'STRONG_BEARISH';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  projectedPath: ProjectedCandle[];
  keyFactors: string[];
  evidenceQuality: 'HIGH' | 'MODERATE' | 'LOW';
  actualOutcome?: {
    resolvedAt: number;
    actualPrice: number;
    actualPercentageChange: number;
    wasAccurate: boolean;
    rangeMaintained: boolean;
    errorMargin: number;
  };
}

export interface MarketMeta {
  symbol: string;
  regularMarketPrice: number;
  previousClose: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  lastUpdatedTime: number;
  dataStatus: 'LIVE' | 'CLOSED_HISTORICAL' | 'DELAYED';
}

export interface MarketStatus {
  isOpen: boolean;
  isPreMarket: boolean;
  isPostMarket: boolean;
  isHoliday: boolean;
  isWeekend: boolean;
  sessionState: 'LIVE_TRADING' | 'PRE_MARKET' | 'POST_MARKET' | 'CLOSED';
  istTimeString: string;
  istDateString: string;
  nextOpenTimeIST: string;
  nextCloseTimeIST: string;
  secondsToNextEvent: number;
  message: string;
}

export interface AccuracyStats {
  totalEvaluated: number;
  overallDirectionalAccuracy: number;
  rolling50Accuracy: number;
  rolling100Accuracy: number;
  bullishAccuracy: number;
  bearishAccuracy: number;
  niftyAccuracy: number;
  bankNiftyAccuracy: number;
  averageErrorMarginPoints: number;
  walkForwardTested: boolean;
  lookAheadBiasEliminated: boolean;
}

export interface AppNotification {
  id: string;
  timestamp: number;
  type: 'BULLISH_SIGNAL' | 'BEARISH_SIGNAL' | 'REVERSAL' | 'BREAKOUT' | 'SR_BREAK' | 'SYSTEM';
  title: string;
  message: string;
  symbol: '^NSEI' | '^NSEBANK';
  read: boolean;
}

export interface NotificationSettings {
  bullishAlerts: boolean;
  bearishAlerts: boolean;
  trendReversals: boolean;
  breakouts: boolean;
  srBreaks: boolean;
  marketOpenClose: boolean;
  soundEnabled: boolean;
  minConfidence: number;
}

// ==========================================
// OPEN INTEREST (OI) ANALYSIS TYPES
// ==========================================
export type BuildupType = 'LONG_BUILDUP' | 'SHORT_BUILDUP' | 'LONG_UNWINDING' | 'SHORT_COVERING';

export interface StrikeOIData {
  strikePrice: number;
  isAtm: boolean;
  distanceFromSpot: number;
  callOi: number;
  callOiChange: number;
  callLtp: number;
  callLtpChange: number;
  callIv: number;
  callVolume: number;
  callBuildup: BuildupType;
  putOi: number;
  putOiChange: number;
  putLtp: number;
  putLtpChange: number;
  putIv: number;
  putVolume: number;
  putBuildup: BuildupType;
}

export interface OpenInterestAnalysis {
  symbol: '^NSEI' | '^NSEBANK';
  symbolName: string;
  spotPrice: number;
  atmStrike: number;
  expiryDate: string;
  timestamp: number;
  totalCallOi: number;
  totalPutOi: number;
  totalCallOiChange: number;
  totalPutOiChange: number;
  pcr: number;
  pcrSentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  highestCallOiStrike: number;
  highestPutOiStrike: number;
  secondHighestCallOiStrike: number;
  secondHighestPutOiStrike: number;
  highestCallOiChangeStrike: number;
  highestPutOiChangeStrike: number;
  strongResistance: number;
  strongSupport: number;
  maxPainStrike: number;
  overallBuildup: BuildupType;
  signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  signalReason: string;
  strikes: StrikeOIData[];
  dataStatus: 'LIVE' | 'CLOSED_HISTORICAL' | 'DELAYED' | 'UNAVAILABLE';
}

// ==========================================
// MARKET DEPTH (LEVEL 2 ORDER BOOK) TYPES
// ==========================================
export interface DepthLevel {
  level: number;
  buyOrders: number;
  buyQuantity: number;
  bidPrice: number;
  askPrice: number;
  sellQuantity: number;
  sellOrders: number;
}

export interface MarketDepthData {
  symbol: '^NSEI' | '^NSEBANK';
  symbolName: string;
  spotPrice: number;
  timestamp: number;
  levels: DepthLevel[];
  totalBuyQuantity: number;
  totalSellQuantity: number;
  totalBuyOrders: number;
  totalSellOrders: number;
  buyPressurePercent: number;
  sellPressurePercent: number;
  orderBookImbalance: number; // -100 to +100
  spread: number;
  signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  signalStrength: 'STRONG' | 'MODERATE' | 'WEAK';
  pressureSummary: string;
  dataStatus: 'LIVE' | 'CLOSED_HISTORICAL' | 'DELAYED' | 'UNAVAILABLE';
}

