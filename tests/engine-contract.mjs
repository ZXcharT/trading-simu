import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { simulate } from '../js/engine.mjs';
import { createLcg } from '../js/random.mjs';

const params = {
  winRate:45, rewardRisk:2, trades:100, runs:1000,
  targetReturnIndex:30, maxDrawdown:20, annualTrades:50
};
const expected = {
  'legacy-standard':'1ea95b3913728f00a93c33d6eae68754dfcaa257180621d70437691b979d5cd9',
  'legacy-lowrisk':'c5892adc152b92e453910b286c07548373b63619980660669afdcac33e5e58cf',
  'legacy-trade':'c232c0dbecc4a7a19feaf7ee16153578dfd494a235a992e7c81d74064db5da09'
};
const random = createLcg(246813579);

function legacyDigest(result) {
  const object = Object.fromEntries(result.strategies.map(strategy => [strategy.id, {
    absMin:strategy.absoluteMin,
    absMax:strategy.absoluteMax,
    ruinPct:strategy.ruinRate.toFixed(1),
    halvePct:strategy.halveRate.toFixed(1),
    medianDrawdown:strategy.p80Drawdown.toFixed(1),
    finalValues:Array.from(strategy.finalValues),
    medianPath:Array.from(strategy.median),
    p10Path:Array.from(strategy.p10),
    p90Path:Array.from(strategy.p90)
  }]));
  return crypto.createHash('sha256').update(JSON.stringify(object)).digest('hex');
}

for (const basis of Object.keys(expected)) {
  const result = await simulate({ ...params, basis }, random);
  assert.equal(legacyDigest(result), expected[basis], basis);
  for (const strategy of result.strategies) {
    for (let i = 0; i < strategy.stride; i++) {
      assert.ok(strategy.p10[i] <= strategy.median[i]);
      assert.ok(strategy.median[i] <= strategy.p90[i]);
    }
    assert.ok(strategy.ruinRate >= 0 && strategy.ruinRate <= 100);
    assert.ok(strategy.halveRate >= 0 && strategy.halveRate <= 100);
  }
}
console.log('ENGINE_LEGACY_CONTRACT_PASS 3');
