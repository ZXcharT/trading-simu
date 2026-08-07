export const TARGET_RETURN_VALUES = [
  10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,
  32,34,36,38,40,42,44,46,48,50,55,60,65,70,75,80,85,90,95,100,
  110,120,130,140,150,160,170,180,190,200,220,240,260,280,300
];

export const BASIS = {
  decision: [
    ['t1','低风险','低风险方案','#14715c',0.25],
    ['t2','测试风险','测试风险方案','#557da8',0.5],
    ['t3','建议上限','建议风险上限','#2563eb',1],
    ['t4','超出上限 1.5×','高风险方案','#996421',1.5],
    ['t5','超出上限 2×','极高风险方案','#c94742',2]
  ],
  theory: [
    ['l1','1/12 凯利','1/12 凯利','#7257a5',1/12],
    ['l2','1/8 凯利','1/8 凯利','#8f6a96',1/8],
    ['l3','1/6 凯利','1/6 凯利','#3f7f8b',1/6],
    ['l4','1/4 凯利','1/4 凯利','#14715c',0.25],
    ['c2','1/2 凯利','1/2 凯利','#557da8',0.5],
    ['c3','满凯利','满凯利','#2563eb',1],
    ['c4','1.5× 凯利','1.5× 凯利','#996421',1.5],
    ['c5','2.1× 凯利','2.1× 凯利','#c94742',2.1]
  ],
  'legacy-standard': [
    ['c2','标准 (1/2)','标准策略','#0ea5e9',0.5],
    ['c3','巅峰 (满)','满凯利策略','#3b82f6',1],
    ['c4','贪婪 (1.5x)','贪婪策略','#f59e0b',1.5],
    ['c5','赌徒 (2.1x)','赌徒策略','#f43f5e',2.1]
  ],
  'legacy-lowrisk': [
    ['l1','极稳 (1/12)','微仓极稳策略','#8b5cf6',1/12],
    ['l2','保守 (1/8)','保守防守策略','#d946ef',1/8],
    ['l3','进阶 (1/6)','进阶均衡策略','#06b6d4',1/6],
    ['l4','稳健 (1/4)','稳健策略','#10b981',0.25]
  ],
  'legacy-trade': [
    ['t1','保守 (1/4x)','保守建议风险','#10b981',0.25],
    ['t2','稳健 (1/2x)','稳健建议风险','#0ea5e9',0.5],
    ['t3','满额 (1x)','建议风险敞口','#3b82f6',1],
    ['t4','激进 (1.5x)','激进风险溢价','#f59e0b',1.5],
    ['t5','极限 (2x)','极限风暴模式','#f43f5e',2]
  ]
};

export class CancelledError extends Error {
  constructor() { super('simulation cancelled'); this.name = 'CancelledError'; }
}

export function deterministicSummary(params) {
  const p = params.winRate / 100;
  const b = params.rewardRisk;
  const q = 1 - p;
  const expectancy = p * b - q;
  let fullKelly = p - q / b;
  if (!Number.isFinite(fullKelly) || fullKelly < 0) fullKelly = 0;
  return { p, b, q, expectancy, breakEvenWinRate: 100 / (b + 1), fullKelly };
}

function minimumRiskForTarget(p, b, annualTrades, targetReturn, fullKelly) {
  const targetGrowth = Math.log(1 + targetReturn / 100) / annualTrades;
  const maxGrowth = p * Math.log(1 + b * fullKelly) + (1 - p) * Math.log(1 - fullKelly);
  if (maxGrowth < targetGrowth) return -1;
  let low = 0, high = fullKelly;
  for (let i = 0; i < 20; i++) {
    const mid = (low + high) / 2;
    const growth = p * Math.log(1 + b * mid) + (1 - p) * Math.log(1 - mid);
    if (growth < targetGrowth) low = mid; else high = mid;
  }
  return high;
}

async function checkpoint(runtime, stage, completed, total) {
  if (runtime.isCancelled?.()) throw new CancelledError();
  runtime.onProgress?.({ stage, completed, total });
  await runtime.yieldControl?.();
  if (runtime.isCancelled?.()) throw new CancelledError();
}

async function drawdownP80(p, b, trades, fraction, random, runtime, progressOffset = 0, runs = 300) {
  if (fraction <= 0) return 0;
  const values = new Float64Array(runs);
  for (let r = 0; r < runs; r++) {
    let equity = 1, peak = 1, maxDrawdown = 0;
    for (let t = 0; t < trades; t++) {
      equity *= random() < p ? 1 + b * fraction : 1 - fraction;
      if (equity > peak) peak = equity;
      const drawdown = (peak - equity) / peak;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }
    values[r] = maxDrawdown;
    if ((r + 1) % 25 === 0) await checkpoint(runtime, 'reverse', progressOffset + r + 1, runs * 8);
  }
  values.sort();
  return values[Math.floor(runs * 0.8)];
}

async function reverseRisk(params, summary, random, runtime) {
  if (summary.expectancy <= 0 || summary.fullKelly <= 0) {
    return { recommendedRisk: 0, testRisk: 0, targetRequiredRisk: -1, drawdownRisk: 0, limitingFactor: 'negative-expectancy', targetReachable: false };
  }
  const targetReturn = TARGET_RETURN_VALUES[params.targetReturnIndex];
  const targetRequiredRisk = minimumRiskForTarget(summary.p, summary.b, params.annualTrades, targetReturn, summary.fullKelly);
  let low = 0, high = summary.fullKelly, drawdownRisk = summary.fullKelly;
  for (let step = 0; step < 8; step++) {
    const mid = (low + high) / 2;
    const p80 = await drawdownP80(summary.p, summary.b, params.trades, mid, random, runtime, step * 300);
    if (p80 > params.maxDrawdown / 100) high = mid;
    else { low = mid; drawdownRisk = mid; }
  }
  const recommendedRisk = Math.min(summary.fullKelly, drawdownRisk);
  const limitingFactor = drawdownRisk < summary.fullKelly ? 'drawdown' : 'kelly';
  const targetReachable = targetRequiredRisk !== -1 && recommendedRisk >= targetRequiredRisk;
  return { recommendedRisk, testRisk: recommendedRisk / 2, targetRequiredRisk, drawdownRisk, limitingFactor, targetReachable, targetReturn };
}

function strategyDefinitions(basis, summary, reverse) {
  const rows = BASIS[basis] || BASIS.decision;
  const base = basis === 'decision' || basis === 'legacy-trade' ? reverse.recommendedRisk : summary.fullKelly;
  return rows.map(([id,name,title,color,multiplier]) => ({ id,name,title,color,multiplier,fraction:base * multiplier }));
}

function kde(values, points = 180) {
  const n = values.length;
  if (!n) return { x: new Float64Array(), y: new Float64Array() };
  const logs = new Float64Array(n);
  let mean = 0;
  for (let i = 0; i < n; i++) { logs[i] = Math.log10(values[i]); mean += logs[i]; }
  mean /= n;
  let variance = 0;
  for (let i = 0; i < n; i++) variance += (logs[i] - mean) ** 2;
  variance /= n;
  let std = Math.sqrt(variance);
  if (std < 1e-9) std = 1e-9;
  const bandwidth = std * Math.pow(n, -1/5);
  let min = Infinity, max = -Infinity;
  for (const value of logs) { if (value < min) min = value; if (value > max) max = value; }
  min -= bandwidth * 2; max += bandwidth * 2;
  const x = new Float64Array(points), y = new Float64Array(points);
  const step = (max - min) / (points - 1);
  const norm = Math.sqrt(2 * Math.PI);
  for (let i = 0; i < points; i++) {
    const grid = min + i * step;
    let density = 0;
    for (let j = 0; j < n; j++) {
      const u = (grid - logs[j]) / bandwidth;
      density += Math.exp(-0.5 * u * u) / norm;
    }
    x[i] = 10 ** grid;
    y[i] = density / (n * bandwidth);
  }
  return { x, y };
}

function copyPath(matrix, runIndex, stride) {
  return matrix.slice(runIndex * stride, (runIndex + 1) * stride);
}

export async function simulate(params, random = Math.random, runtime = {}) {
  const summary = deterministicSummary(params);
  const reverse = await reverseRisk(params, summary, random, runtime);
  const definitions = strategyDefinitions(params.basis || 'decision', summary, reverse);
  const strategyCount = definitions.length;
  const runs = params.runs;
  const trades = params.trades;
  const stride = trades + 1;
  const matrices = definitions.map(() => new Float64Array(runs * stride));
  const drawdowns = definitions.map(() => new Float64Array(runs));
  const absoluteMin = new Float64Array(strategyCount); absoluteMin.fill(Infinity);
  const absoluteMax = new Float64Array(strategyCount); absoluteMax.fill(-Infinity);

  for (let r = 0; r < runs; r++) {
    const equities = new Float64Array(strategyCount); equities.fill(100);
    const peaks = new Float64Array(strategyCount); peaks.fill(100);
    const maxDrawdowns = new Float64Array(strategyCount);
    for (let s = 0; s < strategyCount; s++) matrices[s][r * stride] = 100;
    for (let t = 1; t <= trades; t++) {
      const win = random() < summary.p;
      for (let s = 0; s < strategyCount; s++) {
        const fraction = definitions[s].fraction;
        let equity = equities[s];
        if (equity > 0.001 && fraction > 0 && summary.fullKelly > 0) {
          equity *= win ? 1 + summary.b * fraction : 1 - fraction;
          if (equity > 1e80) equity = 1e80;
          if (equity < 0.001) equity = 0.001;
        } else if (equity <= 0.001) equity = 0.001;
        equities[s] = equity;
        matrices[s][r * stride + t] = equity;
        if (equity > peaks[s]) peaks[s] = equity;
        const dd = (peaks[s] - equity) / peaks[s];
        if (dd > maxDrawdowns[s]) maxDrawdowns[s] = dd;
        if (equity < absoluteMin[s]) absoluteMin[s] = equity;
        if (equity > absoluteMax[s]) absoluteMax[s] = equity;
      }
    }
    for (let s = 0; s < strategyCount; s++) drawdowns[s][r] = maxDrawdowns[s];
    if ((r + 1) % 25 === 0 || r === runs - 1) await checkpoint(runtime, 'paths', r + 1, runs);
  }

  const strategies = [];
  const work = new Float64Array(runs);
  for (let s = 0; s < strategyCount; s++) {
    const matrix = matrices[s];
    const finalValues = new Float64Array(runs);
    let minRun = 0, maxRun = 0, minFinal = Infinity, maxFinal = -Infinity;
    let ruinCount = 0, halveCount = 0;
    for (let r = 0; r < runs; r++) {
      const value = matrix[r * stride + trades];
      finalValues[r] = value;
      if (value < minFinal) { minFinal = value; minRun = r; }
      if (value > maxFinal) { maxFinal = value; maxRun = r; }
      if (value < 10) ruinCount++;
      if (value < 50) halveCount++;
    }
    drawdowns[s].sort();
    const p10 = new Float64Array(stride), median = new Float64Array(stride), p90 = new Float64Array(stride);
    for (let t = 0; t < stride; t++) {
      for (let r = 0; r < runs; r++) work[r] = matrix[r * stride + t];
      work.sort();
      p10[t] = work[Math.floor(runs * 0.1)];
      median[t] = work[Math.floor(runs * 0.5)];
      p90[t] = work[Math.floor(runs * 0.9)];
      if ((t + 1) % 10 === 0 || t === trades) await checkpoint(runtime, 'aggregate', s * stride + t + 1, strategyCount * stride);
    }
    const sampleCount = Math.min(30, runs);
    const samples = new Float64Array(sampleCount * stride);
    for (let r = 0; r < sampleCount; r++) samples.set(matrix.subarray(r * stride, (r + 1) * stride), r * stride);
    const distribution = kde(finalValues);
    strategies.push({
      ...definitions[s], runs, trades, stride, sampleCount,
      absoluteMin: absoluteMin[s], absoluteMax: absoluteMax[s],
      ruinRate: ruinCount / runs * 100, halveRate: halveCount / runs * 100,
      p80Drawdown: drawdowns[s][Math.floor(runs * 0.8)] * 100,
      minPath: copyPath(matrix, minRun, stride), maxPath: copyPath(matrix, maxRun, stride),
      p10, median, p90, samples, finalValues,
      distributionX: distribution.x, distributionY: distribution.y
    });
    await checkpoint(runtime, 'distribution', s + 1, strategyCount);
  }
  return { params: { ...params }, summary, reverse, strategies, completedAt: Date.now() };
}

export function transferableBuffers(result) {
  const buffers = [];
  for (const strategy of result.strategies) {
    for (const key of ['minPath','maxPath','p10','median','p90','samples','finalValues','distributionX','distributionY']) buffers.push(strategy[key].buffer);
  }
  return buffers;
}
