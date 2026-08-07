import assert from 'node:assert/strict';
import {simulate,transferableBuffers} from '../js/engine.mjs';
import {createLcg} from '../js/random.mjs';
const params={winRate:45,rewardRisk:2,trades:50,runs:100,targetReturnIndex:30,maxDrawdown:20,annualTrades:50};
function counted(seed){const random=createLcg(seed);let calls=0;return {random:()=>{calls++;return random()},count:()=>calls}}
function snapshot(strategies){return strategies.map(row=>({id:row.id,fraction:row.fraction,median:Array.from(row.median),finalValues:Array.from(row.finalValues)}))}
const dualRandom=counted(99);const dual=await simulate({...params,bases:['decision','theory']},dualRandom.random);
const decisionRandom=counted(99);const decision=await simulate({...params,basis:'decision'},decisionRandom.random);
const theoryRandom=counted(99);const theory=await simulate({...params,basis:'theory'},theoryRandom.random);
assert.equal(dualRandom.count(),decisionRandom.count(),'双档位必须复用同一份随机结果，不能重复消费随机数');
assert.equal(dualRandom.count(),theoryRandom.count());
assert.deepEqual(snapshot(dual.strategiesByBasis.decision),snapshot(decision.strategies));
assert.deepEqual(snapshot(dual.strategiesByBasis.theory),snapshot(theory.strategies));
assert.equal(dual.strategiesByBasis.decision.length,5);assert.equal(dual.strategiesByBasis.theory.length,8);
assert.equal(new Set(transferableBuffers(dual)).size,13*9);
console.log('DUAL_BASIS_SHARED_PATH_PASS 13');
