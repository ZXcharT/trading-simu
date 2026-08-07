import assert from 'node:assert/strict';
const storage=new Map();
globalThis.window={__ONECHART_KELLY_COOKIE_DOMAIN__:'.onechart.test'};
globalThis.localStorage={setItem:(k,v)=>storage.set(k,v)};
let cookie='';let lastSet='';
globalThis.document={get cookie(){return cookie},set cookie(value){lastSet=value;const pair=value.split(';')[0];const name=pair.split('=')[0];cookie=[...cookie.split('; ').filter(Boolean).filter(x=>!x.startsWith(name+'=')),pair].join('; ')}};
const {syncRiskSuggestion}=await import('../js/kelly-sync.mjs');
const callback=syncRiskSuggestion('callback',2,1);assert.equal(callback.ok,true);assert.ok(storage.has('zxchart_kelly_B1'));assert.match(lastSet,/onechart_kelly_B1_v1=/);assert.match(lastSet,/Domain=\.onechart\.test/);
const startup=syncRiskSuggestion('startup',3,1.5);assert.equal(startup.ok,true);assert.ok(storage.has('zxchart_kelly_B2'));assert.match(lastSet,/onechart_kelly_B2_v1=/);
for(const [key,raw] of storage){const data=JSON.parse(raw);assert.equal(data.v,1);assert.ok(data.type==='B1'||data.type==='B2');assert.ok(data.half<=data.full);assert.ok(key.endsWith(data.type))}
console.log('SYNC_VISIBLE_MAPPING_PASS 2');
