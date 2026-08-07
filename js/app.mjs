import { TARGET_RETURN_VALUES, deterministicSummary } from './engine.mjs';
import { createCharts } from './charts.mjs';
import { syncRiskSuggestion } from './kelly-sync.mjs';

const $ = id => document.getElementById(id);
const stageNames = { reverse:'计算风险边界', paths:'生成随机路径', aggregate:'统计分位结果', distribution:'生成结果分布' };
const state = {
  draft:{winRate:45,rewardRisk:2,trades:100,runs:2000,targetReturnIndex:30,maxDrawdown:20,annualTrades:50},
  viewBasis:'decision',committed:null,lastGoodResult:null,status:'idle',jobCounter:0,activeJobId:null,pending:null,seed:null
};
let worker = null;
let cancelTimer = null;

const charts = createCharts({pathElement:$('pathChart'),distributionElement:$('distributionChart'),onRange:renderRange});

function createWorker() {
  const next = new Worker(new URL('./simulation.worker.mjs',import.meta.url),{type:'module'});
  next.addEventListener('message',handleWorkerMessage);
  next.addEventListener('error',event=>{
    event.preventDefault();
    if(worker===next){next.terminate();worker=null}
    handleFailure(event.message||'Worker 加载失败');
  });
  return next;
}
function ensureWorker(){if(!worker)worker=createWorker();return worker;}
function sameParams(a,b){
  if(!a||!b)return false;
  const comparable=value=>{const {basis,bases,...rest}=value;return rest};
  return JSON.stringify(comparable(a))===JSON.stringify(comparable(b));
}
function resultForBasis(result,basis=state.viewBasis){return {...result,params:{...result.params,basis},strategies:result.strategiesByBasis[basis]}}
function formatPercent(value,digits=2){return Number.isFinite(value)?`${value.toFixed(digits)}%`:'—'}
function formatPoint(value){return Number.isFinite(value)?`${value>=0?'+':''}${value.toFixed(1)}个百分点`:'—'}
function formatMoney(value){if(!Number.isFinite(value))return'—';if(value>=1e8)return`${(value/1e8).toFixed(2)}亿`;if(value>=1e4)return`${(value/1e4).toFixed(2)}万`;return value.toFixed(1)}
function limitingText(value){return({drawdown:'最大回撤',kelly:'凯利上限','negative-expectancy':'数学期望 ≤ 0'})[value]||'—'}
function targetStatusText(reverse){if(reverse.targetRequiredRisk===-1)return'当前策略不可达';return reverse.targetReachable?'安全上限内可达':'需突破风险边界'}
function renderLiveSummary(summary,params){
  const positive=summary.expectancy>0;
  $('expectancyResult').textContent=`${summary.expectancy>=0?'+':''}${summary.expectancy.toFixed(3)}R`;$('expectancyResult').style.color=positive?'var(--gain)':'var(--risk)';$('breakEvenResult').textContent=formatPercent(summary.breakEvenWinRate,1);$('winEdgeResult').textContent=formatPoint(params.winRate-summary.breakEvenWinRate);$('kellyResult').textContent=formatPercent(summary.fullKelly*100);
}

function setStatus(status,label,meta=''){
  state.status=status;$('stateLabel').textContent=label;$('stateMeta').textContent=meta;$('mobileStateLabel').textContent=label;
  $('stateDot').className=`state-dot ${status==='completed'?'complete':status}`;
}
function updateProgress(title,detail,percent=0){$('progressTitle').textContent=title;$('progressDetail').textContent=detail;$('progressBar').style.transform=`scaleX(${Math.max(0,Math.min(100,percent))/100})`}
function updateDraftFromInputs(){
  state.draft={...state.draft,winRate:+$('winRate').value,rewardRisk:+$('rewardRisk').value,trades:+$('trades').value,targetReturnIndex:+$('targetReturnIndex').value,maxDrawdown:+$('maxDrawdown').value,annualTrades:+$('annualTrades').value};
  $('winRateValue').textContent=`${state.draft.winRate}%`;$('rewardRiskValue').textContent=state.draft.rewardRisk.toFixed(1);$('tradesValue').textContent=state.draft.trades;$('targetReturnValue').textContent=`${TARGET_RETURN_VALUES[state.draft.targetReturnIndex]}%`;$('maxDrawdownValue').textContent=`${state.draft.maxDrawdown}%`;$('annualTradesValue').textContent=state.draft.annualTrades;
  const summary=deterministicSummary(state.draft);renderLiveSummary(summary,state.draft);
  if(state.committed&&!sameParams(state.draft,state.committed)){
    for(const id of ['syncCallback','syncStartup'])$(id).disabled=true;$('syncStatus').textContent='参数已改变，重新运行后可应用风险参数';
    if(state.activeJobId!=null)setStatus('computing','计算中','草稿已改变，可重新运行');
    else{setStatus('stale','参数已改变','需要重新运行');updateProgress('结果已过期','当前仍显示上一次完整结果',0)}
  }else if(state.lastGoodResult&&state.activeJobId==null){
    const executable=state.lastGoodResult.summary.expectancy>0&&state.lastGoodResult.reverse.recommendedRisk>0;
    for(const id of ['syncCallback','syncStartup'])$(id).disabled=!executable;$('syncStatus').textContent=executable?'选择买点类型，将风险参数应用到仓位计算器':'数学期望 ≤ 0，暂不提供风险参数';
    setStatus('completed','计算完成',`${state.lastGoodResult.params.runs.toLocaleString()} 次 · seed ${state.seed}`);updateProgress('计算完成','结果已原子更新',100);
  }
}
function requestRun({reshuffle=false}={}){
  updateDraftFromInputs();
  const request={type:'run',jobId:++state.jobCounter,params:{...state.draft,bases:['decision','theory']}};
  if(!reshuffle&&state.seed!=null)request.seed=state.seed;
  if(reshuffle)state.seed=null;
  if(state.activeJobId!=null){
    state.pending=request;ensureWorker().postMessage({type:'cancel',jobId:state.activeJobId});updateProgress('正在取消旧任务','新参数将在取消后开始',0);
    clearTimeout(cancelTimer);cancelTimer=setTimeout(()=>{worker?.terminate();worker=createWorker();state.activeJobId=null;dispatchPending()},500);
  }else dispatchRequest(request);
}
function dispatchRequest(request){
  state.activeJobId=request.jobId;state.status='computing';state.committed={...request.params};$('cancelButton').disabled=false;$('runButton').disabled=false;$('runButton').textContent='重新运行';
  setStatus('computing','计算中',`${request.params.runs.toLocaleString()} 次模拟`);updateProgress('准备计算','正在初始化 Worker',1);ensureWorker().postMessage(request);
}
function dispatchPending(){if(!state.pending)return;const request=state.pending;state.pending=null;dispatchRequest(request)}
function cancelCurrent(){
  if(state.activeJobId==null)return;state.pending=null;ensureWorker().postMessage({type:'cancel',jobId:state.activeJobId});updateProgress('正在取消','保留上一次完整结果',0);
  clearTimeout(cancelTimer);cancelTimer=setTimeout(()=>{worker?.terminate();worker=createWorker();state.activeJobId=null;finishCancelled()},500);
}
function finishCancelled(){clearTimeout(cancelTimer);cancelTimer=null;$('cancelButton').disabled=true;$('runButton').disabled=false;$('runButton').textContent='运行模拟';setStatus(state.lastGoodResult?'stale':'idle','已取消',state.lastGoodResult?'仍显示上次结果':'未生成结果');updateProgress('计算已取消','可以修改参数后重新运行',0);dispatchPending()}
function handleWorkerMessage(event){
  const message=event.data||{};
  if(message.type==='cancelled'&&message.jobId===state.activeJobId){state.activeJobId=null;finishCancelled();return}
  if(message.jobId!==state.activeJobId)return;
  if(message.type==='progress'){updateProgress(stageNames[message.stage]||'计算中',`${message.percent.toFixed(0)}%`,message.percent);return}
  if(message.type==='error'){handleFailure(message.message);return}
  if(message.type==='result'){
    clearTimeout(cancelTimer);cancelTimer=null;state.activeJobId=null;
    if(state.pending){dispatchPending();return}
    state.seed=message.seed;state.lastGoodResult=message.result;state.committed={...message.result.params};$('cancelButton').disabled=true;$('runButton').disabled=false;$('runButton').textContent='运行模拟';renderResult(message.result);
    if(sameParams(state.draft,message.result.params)){setStatus('completed','计算完成',`${message.result.params.runs.toLocaleString()} 次 · seed ${message.seed}`);updateProgress('计算完成','结果已原子更新',100)}
    else{setStatus('stale','参数已改变','当前显示刚完成的上一组参数');updateProgress('结果已过期','运行后应用当前草稿',0)}
  }
}
function handleFailure(message){clearTimeout(cancelTimer);cancelTimer=null;state.activeJobId=null;state.pending=null;$('cancelButton').disabled=true;$('runButton').disabled=false;$('runButton').textContent='运行模拟';setStatus('error','计算失败','保留上一次结果');updateProgress('计算失败',message,0);$('errorPanel').hidden=false;$('errorPanel').textContent=`${message}。请降低模拟精度后重试。`}

function renderResult(result){
  $('errorPanel').hidden=true;const {summary,reverse}=result;
  const positive=summary.expectancy>0;
  $('recommendedRisk').textContent=positive?formatPercent(reverse.recommendedRisk*100):'不提供建议';$('testRisk').textContent=positive?formatPercent(reverse.testRisk*100):'—';$('limitingFactor').textContent=limitingText(reverse.limitingFactor);$('targetStatus').textContent=positive?targetStatusText(reverse):'—';
  for(const id of ['syncCallback','syncStartup'])$(id).disabled=!positive||reverse.recommendedRisk<=0;
  $('syncStatus').textContent=positive?'选择买点类型，将风险参数应用到仓位计算器':'数学期望 ≤ 0，暂不提供风险参数';
  renderBasis(result);
}
function renderBasis(result){
  const view=resultForBasis(result);renderLadder(view);renderDetails(null);charts.setResult(view);$('chartContext').textContent=state.viewBasis==='decision'?'比较建议风险档位':'比较凯利理论档';$('clearStrategy').hidden=true;$('scaleToggle').textContent='尺度：聚焦';
}
function renderLadder(result){
  const container=$('riskLadder');container.replaceChildren();
  for(const row of result.strategies){
    const button=document.createElement('button');button.type='button';button.className='risk-item';button.style.setProperty('--strategy-color',row.color);button.dataset.strategy=row.id;
    button.innerHTML=`<strong>${row.name}</strong><div class="risk-primary"><span>单笔风险</span><b>${formatPercent(row.fraction*100,2)}</b></div><dl><div><dt>最终资金中位数</dt><dd>${formatMoney(row.median[row.trades])}</dd></div><div><dt>劣势回撤</dt><dd>${formatPercent(row.p80Drawdown,1)}</dd></div><div><dt>腰斩概率</dt><dd>${formatPercent(row.halveRate,1)}</dd></div><div><dt>接近归零概率</dt><dd>${formatPercent(row.ruinRate,1)}</dd></div></dl>`;
    button.addEventListener('click',()=>selectStrategy(row.id,result));container.appendChild(button);
  }
}
function selectStrategy(id,result=state.lastGoodResult?resultForBasis(state.lastGoodResult):null){
  if(!result)return;
  charts.selectStrategy(id);const selectedId=charts.getState().selectedId;document.querySelectorAll('.risk-item').forEach(item=>item.classList.toggle('active',item.dataset.strategy===selectedId));$('clearStrategy').hidden=!selectedId;
  const row=result.strategies.find(item=>item.id===selectedId)||null;$('chartContext').textContent=row?`正在分析：${row.name} · 自动显示样本路径`:(state.viewBasis==='decision'?'比较建议风险档位':'比较凯利理论档');renderDetails(row);
}
function renderDetails(row){const box=$('detailContent');if(!row){box.innerHTML='<p>选择一个风险档后查看最低样本、中位数和最高样本。</p>';return}box.innerHTML=`<article><span>最低样本结果</span><strong>${formatMoney(row.minPath[row.trades])}</strong></article><article><span>中位数结果</span><strong>${formatMoney(row.median[row.trades])}</strong></article><article><span>最高样本结果</span><strong>${formatMoney(row.maxPath[row.trades])}</strong></article>`}
function renderRange(value){const box=$('rangeResult');if(!value){box.hidden=true;return}box.hidden=false;box.textContent=`资金区间 ${formatMoney(value.low)} 至 ${formatMoney(value.high)}，落入概率 ${formatPercent(value.probability,1)}`}
function syncTo(buyPoint){
  const result=state.lastGoodResult;if(!result)return;
  const sync=syncRiskSuggestion(buyPoint,result.reverse.recommendedRisk*100,result.reverse.testRisk*100);
  const label=buyPoint==='callback'?'回调买点':'启动买点';
  const time=new Date(sync.timestamp).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'});
  $('syncStatus').textContent=sync.ok?`已应用到${label} · ${time}`:`${label}应用受限，请打开仓位计算器确认`;
}

function setBasis(basis){if(state.viewBasis===basis)return;state.viewBasis=basis;document.querySelectorAll('[data-basis]').forEach(button=>button.classList.toggle('active',button.dataset.basis===basis));$('basisDescription').textContent=basis==='decision'?'围绕建议风险上限比较不同档位':'比较完整凯利理论档位（高级）';if(state.lastGoodResult)renderBasis(state.lastGoodResult)}
function syncTheme(){const dark=document.documentElement.dataset.theme==='dark';$('themeLabel').textContent=dark?'浅色':'深色';$('themeToggle').setAttribute('aria-label',dark?'切换到浅色模式':'切换到深色模式');document.querySelector('meta[name=theme-color]').content=dark?'#0f1216':'#f3f4f6'}
function toggleTheme(){const next=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=next;document.documentElement.style.colorScheme=next;try{localStorage.setItem('onechart-theme',next)}catch{}syncTheme();charts.refreshTheme()}
function toggleDrawer(open){$('parameterPanel').classList.toggle('active',open);$('drawerOverlay').classList.toggle('active',open)}

for(const id of ['winRate','rewardRisk','trades','targetReturnIndex','maxDrawdown','annualTrades'])$(id).addEventListener('input',updateDraftFromInputs);
document.querySelectorAll('[data-basis]').forEach(button=>button.addEventListener('click',()=>setBasis(button.dataset.basis)));
$('runButton').addEventListener('click',()=>requestRun());$('reshuffleButton').addEventListener('click',()=>requestRun({reshuffle:true}));$('cancelButton').addEventListener('click',cancelCurrent);$('clearStrategy').addEventListener('click',()=>{charts.clearSelection();selectStrategy(null)});$('scaleToggle').addEventListener('click',()=>{$('scaleToggle').textContent=`尺度：${charts.toggleScale()==='focus'?'聚焦':'全量'}`});$('rangeReset').addEventListener('click',()=>charts.clearRange());$('syncCallback').addEventListener('click',()=>syncTo('callback'));$('syncStartup').addEventListener('click',()=>syncTo('startup'));$('themeToggle').addEventListener('click',toggleTheme);$('mobileParamsButton').addEventListener('click',()=>toggleDrawer(true));$('closeParams').addEventListener('click',()=>toggleDrawer(false));$('drawerOverlay').addEventListener('click',()=>toggleDrawer(false));window.addEventListener('resize',()=>charts.resize());

syncTheme();updateDraftFromInputs();ensureWorker();requestRun({reshuffle:true});
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
