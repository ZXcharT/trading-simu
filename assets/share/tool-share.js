/* Read-only page adapters. No engine imports, recalculation, Worker messages or storage access. */
'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const value = id => $(id)?.value ?? '';
  const label = id => $(id)?.textContent.trim() || '—';
  const visible = id => !!$(id) && !$(id).classList.contains('hidden') && !$(id).hidden;
  const selected = selector => document.querySelector(selector)?.textContent.trim().replace(/\s+/g,' ') || '—';
  const field = (name, val, extra = {}) => ({name, value:val, ...extra});
  const input = (name, id, prefix = '', suffix = '') => field(name, prefix + value(id) + suffix);
  const range = (name, id, text) => field(name, text, {ratio:(+value(id) - +$(id).min) / (+$(id).max - +$(id).min), min:$(id).min, max:$(id).max});
  function palette() {
    const s = getComputedStyle(document.documentElement);
    const read = (...names) => names.map(name => s.getPropertyValue(name).trim()).find(Boolean);
    return {bg:read('--oc-ground','--ground'),panel:read('--oc-paper','--paper'),control:read('--oc-input','--control'),selected:read('--oc-selected','--selected'),ink:read('--oc-ink','--ink'),text:read('--oc-text','--text'),muted:read('--oc-muted','--muted'),line:read('--oc-line','--line'),accent:read('--oc-accent','--accent'),gain:read('--oc-red','--gain'),loss:read('--oc-green','--risk'),warm:read('--oc-warm','--warm'),info:read('--calc-info','--oc-accent','--accent'),infoFill:read('--calc-info-fill','--oc-panel','--panel'),risk:read('--calc-risk-value','--oc-warm','--warm'),riskFill:read('--calc-gold-fill','--oc-panel','--panel')};
  }
  function base() {return {dark:document.documentElement.dataset.theme === 'dark', narrow:innerWidth <= 700, colors:palette()};}
  function requireNumbers(ids) {if(ids.some(id => !value(id) || !Number.isFinite(+value(id)) || +value(id) <= 0)) throw Error('请先填写有效参数，得到当前计算结果后再截图。');}
  const calcMoney=n=>document.body.dataset.calcUnit==='USDT'?n+' USDT':(document.body.dataset.calcUnit==='USD'?'$':'¥')+n;
  function multiCapture(){
    const view=window.OneChartMultiMarketView?.capture();if(!view)throw Error('多空计算尚未就绪，请稍后重试。');
    const {params:q,result:r,meta:m}=view,s=base(),f=(n,d=2)=>Number.isFinite(n)?n.toLocaleString('zh-CN',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
    const cash=n=>Number.isFinite(n)?(m.currency==='USD'?'$'+f(n):f(n)+' USDT'):'—',price=n=>Number.isFinite(n)?n.toLocaleString('zh-CN',{maximumSignificantDigits:12}):'—',sign=n=>(n>0?'+':n<0?'−':'');
    const money=(name,val,note='')=>field(name,val,{private:true,note}),cost=key=>q[key]===''?'未填，按0估算':q[key];
    s.kind='calc';s.flow='multi';s.market=view.type;s.side=q.side;s.title='多空杠杆 · 开仓计算';s.chips=[m.name,m.currency==='USD'?'$':'USDT',q.side==='long'?'做多':'做空'];s.riskTag=label('mm-risk-level');
    s.params=[money('账户总资金',cash(Number(q.equity))),money('单笔风险金额',label('mm-risk-budget')),range('单笔风险','mm-riskPct',label('mm-risk-value')),field('开仓价格',price(r.entry)),field('止损触发价',price(r.stop))];
    s.metrics=[money('建议数量',f(r.quantity,r.quantityPrecision)+' '+m.unit),money('名义仓位',cash(r.notional)),money('初始保证金 / 资金占用',cash(r.margin)),money('预计止损损失',cash(r.risk),Number.isFinite(r.riskPercent)?'占账户 '+f(r.riskPercent)+'% · 含已填费用':'未形成可交易数量')];
    s.riskTicks=[...document.querySelectorAll('.mm-risk-ticks span')].map(n=>({name:n.textContent,ratio:parseFloat(n.style.left)/100}));
    s.status=r.status==='ready'?'约束来源：'+r.limiting+'。'+r.liquidation:r.message;
    s.groups=(r.goals||[]).map((g,i)=>({name:'第'+(i?'二':'一')+'目标',badge:price(g.rr)+'R',note:g.reachable?(g.priceAligned?'':'理论价不符合价格步长，未自动调整。'):g.message,items:g.reachable?[field('理论目标价',price(g.price),{tone:g.price>r.entry?'gain':g.price<r.entry?'loss':null}),money('预计净收益',sign(g.net)+cash(Math.abs(g.net))),field('含成本净盈亏比',f(g.netRR)+'R',{tone:g.net>0?'gain':g.net<0?'loss':null}),field('账户收益',sign(g.accountReturn)+f(Math.abs(g.accountReturn))+'%',{tone:g.accountReturn>0?'gain':g.accountReturn<0?'loss':null})]:[]}));
    for(let i=0;i<s.groups.length;i++)if(s.groups[i].items[1])s.groups[i].items[1].tone=r.goals[i].net>0?'gain':r.goals[i].net<0?'loss':null;
    s.specs=[money('本笔可用资金',cash(Number(q.available))),field('数量步长 / 最小下单量',q.step+' / '+q.minQty),field('最小名义金额',q.minNotional||'未填'),field('价格步长',q.priceStep||'未填，未校验'),field('第一 / 第二目标 · 价差RR',q.rr1+'R / '+q.rr2+'R')];
    if(view.type!=='stocks')s.specs.push(field(m.multiplier,q.multiplier));
    s.specs.push(view.type==='crypto'?field('杠杆倍数',q.leverage+'倍'):view.type==='futures'?field('每张初始保证金',cash(Number(q.marginPerUnit))):field('实际资金占用比例',q.marginPct+'%'));
    s.specs.push(field('费用计价',q.feeMode==='rate'?'按成交金额费率（%）':'按每交易单位金额'),field('开仓 / 平仓费用',cost('feeEntry')+' / '+cost('feeExit')+(q.feeMode==='rate'?' %':m.currency==='USD'?' $/'+m.unit:' USDT/'+m.unit)),field('止损滑点',cost('slippage')),money('预计持仓成本',q.carry===''?'未填，按0估算':cash(Number(q.carry))));
    if(view.type==='crypto')s.specs.push(field('保证金模式',{unknown:'未确认',isolated:'逐仓',cross:'全仓'}[q.marginMode]),field('止损触发基准',q.stopBasis==='mark'?'标记价格':q.stopBasis==='last'?'最新成交价 / 其他':'未确认'),field('平台强平参考价',q.liquidation||'未填，未核验'));
    s.bars=[{name:'止损损失 / 单笔风险预算',ratio:Number.isFinite(r.risk)?r.risk/r.budget:0,tone:'risk'},{name:'资金预留 / 本笔可用资金',ratio:r.available>0&&Number.isFinite(r.fundsReserved)?r.fundsReserved/r.available:0,tone:'info'}];
    s.levels=[{name:'止损',value:r.stop},{name:'开仓',value:r.entry},...(r.goals||[]).map((g,i)=>g.reachable?{name:'目标'+(i+1),value:g.price}:null).filter(Boolean)].map(v=>({...v,text:price(v.value),tone:v.value>r.entry?'gain':v.value<r.entry?'loss':null}));
    s.warning=(view.demo?'演示参数：非实时行情、实际保证金或平台费率。':'')+(r.notes||[]).join('；');return s;
  }
  function calcCapture() {
    if(document.body.dataset.calcMarketMode==='multi')return multiCapture();
    const s = base();s.kind = 'calc';s.flow = document.querySelector('.page-container.active')?.id.replace('page-','');
    if(s.flow === 'position') {
      const percent = $('mode-percent').classList.contains('active');
      requireNumbers(['accountBalance','entryPrice',percent ? 'stopPercent':'stopPrice']);
      if(percent ? +value('stopPercent') >= 100 : +value('stopPrice') >= +value('entryPrice')) throw Error('止损参数无效，请修正后再截图。');
      if(!$('emptyState').classList.contains('hidden') || $('resultsContainer').classList.contains('opacity-50')) throw Error('请先完成当前开仓计算。');
      for(const id of ['positionBreakevenRR','positionTargetRR'])if($(id)&&($(id).getAttribute('aria-invalid')==='true'||!value(id)||!Number.isFinite(+value(id))||+value(id)<=0))throw Error('请先填写有效的盈亏比，再生成截图。');
      if(['targetPrice','breakevenPrice','targetProfit'].some(id=>!Number.isFinite(Number(label(id)))))throw Error('目标结果超出可显示范围，请检查价格与盈亏比。');
      const choices=selector=>[...document.querySelectorAll(selector)].map(node=>({name:node.textContent.trim().replace(/\s+/g,' '),active:node.classList.contains('active')||node.getAttribute('aria-pressed')==='true'}));
      s.controls={mode:document.querySelector('.mm-mode')?choices('.mm-mode [data-mm-mode]'):[{name:'A股',active:true}],buy:choices('.type-btn'),stop:choices('.mode-btn')};
      s.riskTicks=[...$('sliderTicks').children].map(node=>({name:node.textContent,ratio:parseFloat(node.style.left)/100}));
      s.usage=Number(label('capitalUsage'));s.targetRR=parseFloat(label('targetRRBadge'));
      s.title = '开仓计算';s.chips = ['A股',selected('.type-btn.active'),selected('.mode-btn.active')];
      s.params = [{...input('账户总资金','accountBalance','¥'),private:true},field('单笔风险金额','¥' + label('plannedRiskAmount'),{private:true}),range('单笔风险','riskSlider',label('riskSliderVal')),input('开仓价格','entryPrice','¥'),input(percent ? '止损幅度':'止损价格',percent ? 'stopPercent':'stopPrice',percent ? '−':'¥',percent ? '%':'')];
      s.riskTag = label('riskLevelTag');s.stopHint = label(percent ? 'percentModeInfo':'priceModeInfo');
      s.metrics = [field('仓位金额','¥' + label('positionValue'),{note:'资金利用率 ' + label('capitalUsage') + '%',tone:'info',private:true}),field('建议股数',label('positionShares') + ' 股',{note:visible('sharesAdjustHint') ? label('sharesAdjustHint'):'',tone:'info',private:true}),field('实际风险金额','¥' + label('actualRiskAmount'),{note:'占账户 ' + label('actualRiskPercentDisplay'),tone:'risk',private:true})];
      s.groups = [{name:'脱离成本区',badge:label('breakevenRRBadge'),items:[field('目标价格','¥' + label('breakevenPrice')),field('对应涨幅','+' + label('breakevenPercent') + '%',{tone:'gain'})]}, {name:'目标收益点位',badge:label('targetRRBadge'),items:[field('目标价格','¥' + label('targetPrice'),{tone:'gain'}),field('预期收益','¥' + label('targetProfit'),{tone:'gain',private:true}),field('对应涨幅','+' + label('targetUpPercent') + '%',{tone:'gain'})]}];
      s.warning = [visible('warningBox') ? $('warningText').innerText:'',visible('budgetNotice') ? [$('budgetRiskText')?.textContent,$('budgetCapitalText')?.textContent].filter(Boolean).join('；'):''].filter(Boolean).join('；');
    } else if(s.flow === 'pit') {
      requireNumbers(['pitTopPrice','pitBottomPrice','pitCurrentPrice']);
      if(+value('pitBottomPrice') >= +value('pitTopPrice')) throw Error('坑底价格必须低于坑口价格，请修正后再截图。');
      if(!$('pitEmptyState').classList.contains('hidden')) throw Error('请先完成当前出坑计算。');
      s.title = '出坑计算';s.chips = [];
      s.params = [field('坑口价格',calcMoney(value('pitTopPrice'))),field('坑底价格',calcMoney(value('pitBottomPrice'))),field('当前价格',calcMoney(value('pitCurrentPrice')))];
      s.metrics = [field('出坑目标价',calcMoney(label('pitTargetPrice')),{tone:'gain'}),field('距离目标涨幅',label('pitProfitPercent') + '%',{tone:+label('pitProfitPercent') > 0 ? 'gain':+label('pitProfitPercent') < 0 ? 'loss':null})];
      s.groups = [{name:'价格参照',items:[field('坑口价格',calcMoney(label('displayPitTop'))),field('坑底价格',calcMoney(label('displayPitBottom'))),field('当前价格',calcMoney(label('displayPitCurrent'))),field('坑深','−' + label('pitDepth') + '%',{tone:'loss'})]}];
      s.warning = visible('pitWarningBox') ? label('pitWarningText'):'';
    } else {
      requireNumbers(['protectEntryPrice','protectStopPrice','protectHighPrice','protectRR','retracePercent']);
      if(+value('protectStopPrice') >= +value('protectEntryPrice') || +value('protectHighPrice') < +value('protectEntryPrice') || +value('retracePercent') > 100) throw Error('保护参数无效，请修正后再截图。');
      if(!$('protectEmptyState').classList.contains('hidden')) throw Error('请先完成当前回撤保护计算。');
      s.title = '回撤保护';s.chips = [label('protectStatusTitle')];
      s.params = [field('开仓价格',calcMoney(value('protectEntryPrice'))),field('初始止损',calcMoney(value('protectStopPrice'))),field('最高价格',calcMoney(value('protectHighPrice'))),range('目标盈亏比','customRRSlider',value('protectRR') + ':1'),input('利润回撤比例','retracePercent','','%')];
      s.metrics = [field('实际盈亏比',label('actualRR') + ':1',{note:'目标 ' + label('targetRRDisplay') + ':1'})];
      s.status = label('protectStatusDesc');
      s.groups = visible('retraceResultBox') ? [{name:'利润保护',items:[field('回撤保护价',calcMoney(label('retracePrice'))),field('利润回撤比例','−' + label('retracePercentDisplay') + '%',{tone:'loss'}),field('最大浮盈','+' + label('maxProfit') + '%',{tone:'gain'}),field('锁定利润','+' + label('lockedProfit') + '%',{tone:'gain'})]}] : [];
    }
    return s;
  }
  function compactSimuCharts(){
    const bind=()=>{let ready=true;
      for(const id of ['pathChart','distributionChart']){
        const node=$(id),chart=window.echarts?.getInstanceByDom(node);if(!chart){ready=false;continue;}if(chart.__oneChartCompactLegend)continue;
        const heading=node.closest('article').querySelector('.chart-heading'),host=document.createElement('div');host.className='compact-chart-legend';host.setAttribute('role','group');host.setAttribute('aria-label','图例：点击显示或隐藏曲线');heading.append(host);
        let scheduled=false,namesKey='';
        const apply=()=>{scheduled=false;if(chart.isDisposed())return;const option=chart.getOption(),grid=option?.grid?.[0],legend=option?.legend?.[0];if(!grid||!legend)return;
          const names=(legend.data||[]).map(v=>typeof v==='string'?v:v.name),key=JSON.stringify(names);
          if(key!==namesKey){host.replaceChildren();for(const name of names){const button=document.createElement('button');button.type='button';button.dataset.lineName=name;const dot=document.createElement('i');dot.setAttribute('aria-hidden','true');button.append(dot,document.createTextNode(name));button.addEventListener('click',()=>chart.dispatchAction({type:'legendToggleSelect',name}));host.append(button);}namesKey=key;}
          for(const button of host.children){const name=button.dataset.lineName,series=option.series?.find(s=>s.name===name),selected=legend.selected?.[name]!==false;button.setAttribute('aria-pressed',String(selected));button.title=(selected?'隐藏':'显示')+' '+name;button.querySelector('i').style.background=series?.lineStyle?.color||series?.itemStyle?.color||'var(--muted)';}
          if(grid.top===20&&grid.bottom===34&&legend.show===false&&option.xAxis?.[0]?.name===''&&option.yAxis?.[0]?.name==='')return;
          const color=option.yAxis?.[0]?.nameTextStyle?.color||getComputedStyle(document.documentElement).getPropertyValue('--text').trim(),labels=id==='pathChart'?['资金','交易次数']:['最终资金','相对密度'];
          chart.setOption({grid:{top:20,bottom:34},legend:{show:false},xAxis:{name:''},yAxis:{name:''},graphic:[{id:'onechart-axis-y',type:'text',left:Number(grid.left)+8,top:14.5,silent:true,z:100,style:{text:labels[0],fill:color,fontSize:11,fontWeight:500}},{id:'onechart-axis-x',type:'text',right:Number(grid.right)+8,bottom:42,silent:true,z:100,style:{text:labels[1],fill:color,fontSize:11,fontWeight:500}}]},{silent:true});
        };
        const schedule=()=>{if(!scheduled){scheduled=true;requestAnimationFrame(apply);}};
        chart.on('finished',schedule);chart.on('legendselectchanged',schedule);chart.__oneChartCompactLegend={dispose(){chart.off('finished',schedule);chart.off('legendselectchanged',schedule);host.remove();}};schedule();
      }
      return ready;
    };
    if(!bind()){const observer=new MutationObserver(()=>{if(bind())observer.disconnect();});for(const id of ['pathChart','distributionChart'])observer.observe($(id),{childList:true,subtree:true});}
  }
  function simuCapture() {
    if(label('stateLabel') !== '计算完成' || !$('stateDot').classList.contains('complete')) throw Error('请等待当前参数模拟完成后再截图；参数已改变、已取消或旧结果不会混入分享图。');
    const s = base();s.kind = 'simu';s.title = '概率模拟';s.basis = selected('[data-basis].active');s.context = label('chartContext');s.scale = label('scaleToggle');
    s.params = [range('胜率','winRate',label('winRateValue')),range('盈亏比','rewardRisk',label('rewardRiskValue')),range('观察交易笔数','trades',label('tradesValue')),range('目标年化收益','targetReturnIndex',label('targetReturnValue')),range('可承受回撤','maxDrawdown',label('maxDrawdownValue')),range('年均交易笔数','annualTrades',label('annualTradesValue'))];
    s.summary = [{name:'单笔数学期望',value:label('expectancyResult'),tone:parseFloat(label('expectancyResult')) > 0 ? 'gain':parseFloat(label('expectancyResult')) < 0 ? 'loss':null,items:[field('盈亏平衡胜率',label('breakEvenResult')),field('高于盈亏平衡',label('winEdgeResult')),field('凯利上限',label('kellyResult'))]}, {name:'单笔建议风险敞口 · 满额',value:label('recommendedRisk'),items:[field('半额测试',label('testRisk')),field('主要风险约束',label('limitingFactor')),field('收益目标',label('targetStatus'))]}];
    s.basisDescription = label('basisDescription');
    s.rows = [...document.querySelectorAll('.risk-item')].map(node => ({name:node.querySelector('.risk-name').textContent.trim(),risk:node.querySelector('.risk-primary b').textContent.trim(),color:node.style.getPropertyValue('--strategy-color'),active:node.classList.contains('active'),items:[...node.querySelectorAll('dl>div')].map(row => field(row.querySelector('dt').textContent,row.querySelector('dd').textContent))}));
    s.charts = ['pathChart','distributionChart'].map(id => {const chart = echarts.getInstanceByDom($(id));if(!chart) throw Error('图表尚未就绪，请稍后重试。');const areas=chart.getModel().getComponent('brush')?.areas || [];return {option:chart.getOption(),areas:areas.filter(area=>Array.isArray(area.coordRange)).map(area=>({brushType:area.brushType,yAxisIndex:0,coordRange:[...area.coordRange]}))};});
    s.range = $('rangeResult').hidden ? '' : label('rangeResult');
    s.details = document.querySelector('.advanced-details').open ? [...$('detailContent').querySelectorAll('article')].map(node => field(node.querySelector('span').textContent,node.querySelector('strong').textContent)) : [];
    return s;
  }
  function painter(s, helpers) {
    const W = s.narrow ? 900:s.kind === 'calc' ? 1440:1760, P = s.narrow ? 40:56;
    const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d'), c = s.colors;
    const draw = [];
    const txt = (v,x,y,size=18,color=c.text,max=0,align='left',weight=400) => draw.push(() => helpers.text(ctx,v,x,y,size,color,max,align,weight));
    const rect = (x,y,w,h,fill,r=0,stroke='') => draw.push(() => {ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}});
    const line = (x,y,w) => rect(x,y,w,1,c.line);
    const tone = item => c[item.tone] || c.ink;
    const row = (item,x,y,w,size=18) => {txt(item.name,x,y,size,c.muted,w*.62);txt(item.value,x+w,y,size,tone(item),w*.54,'right',500);};
    const control = (item,x,y,w) => {
      txt(item.name,x,y,17,c.muted,w);rect(x,y+16,w,58,c.control,9);txt(item.value,x+16,y+54,23,c.ink,w-32,'left',500);
      if(item.ratio != null) {const ratio=Math.max(0,Math.min(1,item.ratio));rect(x+8,y+88,w-16,3,c.selected,1.5);rect(x+8,y+88,(w-16)*ratio,3,c.accent,1.5);rect(x+3+(w-16)*ratio,y+83,12,12,c.accent,6);}
    };
    const metric = (item,x,y,w) => {txt(item.name,x,y,17,c.muted,w);txt(item.value,x,y+43,33,tone(item),w,'left',500);if(item.note)txt(item.note,x,y+72,15,c.muted,w);};
    const wrapped = (value,x,y,width,size=17,color=c.warm) => {let acc='',count=0;for(const char of value.replace(/\n+/g,'；')){if(acc.length>=Math.floor(width/size)){txt(acc,x,y+count++*27,size,color,width);acc='';}acc+=char;}if(acc)txt(acc,x,y+count++*27,size,color,width);return count*27;};
    const header = async () => {const logo=await helpers.image('./assets/brand/onechart-lockup-horizontal-' + (s.dark?'white':'black') + '.svg');txt(s.title,P,76,36,c.ink,W-P*2-320,'left',500);draw.push(() => ctx.drawImage(logo,W-P-266,30,266,266*logo.naturalHeight/logo.naturalWidth));line(P,110,W-P*2);};
    const finish = height => {canvas.width=W*2;canvas.height=height*2;ctx.scale(2,2);ctx.fillStyle=c.bg;ctx.fillRect(0,0,W,height);draw.forEach(fn => fn());return canvas;};
    const footer = (y, disclaimer) => {line(P,y,W-P*2);txt(disclaimer,P,y+36,16,c.muted,W-P*2-260);txt('onechartlab.com',W-P,y+36,17,c.muted,230,'right');return y+66;};
    const image = (img,x,y,w,h) => draw.push(() => ctx.drawImage(img,x,y,w,h));
    const measure=(value,size,weight=400)=>{ctx.font=`${weight} ${size}px -apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif`;return ctx.measureText(String(value)).width;};
    return {W,P,c,draw,txt,rect,line,tone,row,control,metric,wrapped,header,finish,footer,image,measure};
  }
  async function positionRender(s,helpers){
    const p=painter(s,helpers);await p.header();const {W,P,c,txt,rect,line}=p;
    const area=W-P*2,gap=44,lw=s.narrow?area:500,rx=s.narrow?P:P+lw+gap,rw=s.narrow?area:area-lw-gap;
    const segment=(options,x,y,w,h=40)=>{rect(x,y,w,h,c.control,10);const cell=(w-6)/options.length;options.forEach((item,i)=>{if(item.active)rect(x+3+i*cell,y+3,cell,h-6,c.selected,8);txt(item.name,x+3+(i+.5)*cell,y+h/2+6,17,item.active?c.ink:c.muted,cell-14,'center',item.active?500:400);});};
    const readout=(item,x,y,w,color=c.ink)=>{txt(item.name,x,y,17,c.muted,w);txt(item.value,x,y+38,30,color,w,'left',500);};
    const top=158;txt('交易参数',P,top,22,c.ink,220);segment(s.controls.mode,P+lw-212,top-24,212,34);
    readout(s.params[0],P,222,(lw-28)/2);readout(s.params[1],P+(lw+28)/2,222,(lw-28)/2,c.risk);
    rect(P,284,lw,112,c.riskFill,12);txt('单笔风险',P+16,314,17,c.risk,100);txt(s.params[2].value,P+112,315,24,c.risk,150,'left',500);txt(s.riskTag,P+lw-16,313,16,c.risk,100,'right');
    const sliderX=P+20,sliderW=lw-40,ratio=Math.max(0,Math.min(1,s.params[2].ratio));rect(sliderX,347,sliderW,4,c.line,2);rect(sliderX,347,sliderW*ratio,4,c.risk,2);rect(sliderX+sliderW*ratio-6,343,12,12,c.risk,6);
    for(const tick of s.riskTicks)if(Number.isFinite(tick.ratio))txt(tick.name,sliderX+tick.ratio*sliderW,378,13,c.risk,44,'center');
    const sw=Math.min(310,lw*.62),valueW=lw-sw-24;
    txt('开仓买点',P,433,17,c.muted,sw);txt(s.params[3].name,P+lw,433,17,c.muted,valueW,'right');segment(s.controls.buy,P,450,sw);txt(s.params[3].value,P+lw,480,27,c.info,valueW,'right',500);
    txt('止损方式',P,532,17,c.muted,sw);txt(s.params[4].name,P+lw,532,17,c.muted,valueW,'right');segment(s.controls.stop,P,549,sw);txt(s.params[4].value,P+lw,579,27,c.loss,valueW,'right',500);txt(s.stopHint,P+lw,615,15,c.muted,lw,'right');
    let y=s.narrow?682:top;txt('计算结果',rx,y,22,c.ink,rw);y+=58;
    const mw=(rw-40)/3;s.metrics.forEach((item,i)=>{const x=rx+i*(mw+20);txt(item.name,x,y,16,c.muted,mw);txt(item.value,x,y+44,29,c[item.tone]||c.ink,mw,'left',500);if(item.note)txt(item.note,x,y+76,14,c.muted,mw);});
    rect(rx,y+96,mw,4,c.control,2);rect(rx,y+96,mw*Math.max(0,Math.min(1,s.usage/100)),4,c.info,2);y+=124;
    const goal=(group,top,height)=>{rect(rx,top,rw,height,c.panel,12);txt(group.name,rx+20,top+34,20,c.ink,rw-140,'left',500);rect(rx+rw-103,top+14,83,31,c.infoFill,7);txt(group.badge,rx+rw-61.5,top+36,17,c.info,75,'center',500);const cw=(rw-60)/2;for(let i=0;i<2;i++){const item=group.items[i],x=rx+20+i*(cw+20);txt(item.name,x,top+76,16,c.muted,cw);txt(item.value,x,top+116,31,group===s.groups[0]&&i===0?c.info:c.gain,cw,'left',500);}if(group.items[2]){txt(group.items[2].name,rx+20,top+157,16,c.muted,rw-180);txt(group.items[2].value,rx+rw-20,top+157,21,c.gain,150,'right',500);}};
    goal(s.groups[0],y,151);y+=167;goal(s.groups[1],y,181);y+=208;
    txt('止损风险 / 目标收益空间',rx,y,17,c.muted,rw-130);txt('1R : '+s.targetRR+'R',rx+rw,y,17,c.ink,120,'right',500);const riskW=rw/(1+s.targetRR);rect(rx,y+21,riskW,10,c.loss,3);rect(rx+riskW,y+21,rw-riskW,10,c.gain,3);txt('1R 风险',rx,y+58,16,c.loss,rw/2);txt(s.targetRR+'R 目标空间',rx+rw,y+58,16,c.gain,rw/2,'right');y+=88;
    if(s.warning){line(rx,y,rw);y+=30;y+=p.wrapped(s.warning,rx,y,rw,17,c.warm)+16;}
    if(!s.narrow)rect(P+lw+gap/2,top-22,1,y-top+22,c.line);
    return p.finish(p.footer(y+12,'仅为参数测算，不构成投资建议。'));
  }
  async function multiRender(s,helpers){
    const p=painter(s,helpers);await p.header();const {W,P,c,txt,rect,line}=p,area=W-P*2,gap=44,lw=s.narrow?area:500,rx=s.narrow?P:P+lw+gap,rw=s.narrow?area:area-lw-gap;
    const val=(item,x,y,w,size=28)=>txt(item.value,x,y,Math.max(15,Math.min(size,w/(String(item.value).length*.65))),p.tone(item),w,'left',500);
    const readout=(item,x,y,w,color)=>{txt(item.name,x,y,16,c.muted,w);val({...item,tone:color},x,y+37,w);};
    txt('交易参数',P,158,22,c.ink,lw/2);txt(s.chips.join(' · '),P+lw,158,19,c.info,lw/2,'right',500);
    readout(s.params[0],P,221,(lw-24)/2);readout(s.params[1],P+(lw+24)/2,221,(lw-24)/2,'risk');
    rect(P,282,lw,110,c.riskFill,12);txt('单笔风险',P+16,311,17,c.risk,110);txt(s.params[2].value,P+122,312,24,c.risk,140,'left',500);txt(s.riskTag,P+lw-16,311,16,c.risk,110,'right');
    const sx=P+20,sw=lw-40,ratio=Math.max(0,Math.min(1,s.params[2].ratio));rect(sx,345,sw,4,c.line,2);rect(sx,345,sw*ratio,4,c.risk,2);rect(sx+sw*ratio-6,341,12,12,c.risk,6);s.riskTicks.forEach(t=>txt(t.name,sx+t.ratio*sw,376,13,c.risk,44,'center'));
    readout(s.params[3],P,432,(lw-24)/2,'info');readout(s.params[4],P+(lw+24)/2,432,(lw-24)/2,'ink');
    txt('规格、资金与成本',P,526,20,c.ink,lw);line(P,546,lw);
    const cw=(lw-24)/2;let leftEnd=568;
    s.specs.forEach((item,i)=>{const x=P+(i%2)*(cw+24),y=578+Math.floor(i/2)*65;txt(item.name,x,y,14,c.muted,cw);val(item,x,y+26,cw,18);leftEnd=y+51;});
    let y=s.narrow?leftEnd+50:158;txt('计算结果',rx,y,22,c.ink,rw);y+=40;y+=p.wrapped(s.status,rx,y,rw,16,c.warm)+23;
    const mw=(rw-28)/2;s.metrics.forEach((item,i)=>{const x=rx+(i%2)*(mw+28),top=y+Math.floor(i/2)*106;txt(item.name,x,top,16,c.muted,mw);val({...item,tone:i===3?'risk':'info'},x,top+40,mw,30);if(item.note)txt(item.note,x,top+69,14,c.muted,mw);});y+=210;
    for(const bar of s.bars){txt(bar.name,rx,y,15,c.muted,rw-110);txt((bar.ratio*100).toFixed(2)+'%',rx+rw,y,17,c[bar.tone],100,'right',500);rect(rx,y+16,rw,5,c.control,2);rect(rx,y+16,rw*Math.max(0,Math.min(1,bar.ratio)),5,c[bar.tone],2);y+=58;}
    const gw=(rw-20)/2;let goalBottom=y;
    s.groups.forEach((g,i)=>{const x=rx+i*(gw+20);rect(x,y,gw,270,c.panel,12);txt(g.name,x+16,y+32,20,c.ink,gw-120);txt(g.badge,x+gw-16,y+32,19,c.info,100,'right',500);g.items.forEach((item,j)=>{txt(item.name,x+16,y+70+j*48,14,c.muted,gw-32);val(item,x+16,y+96+j*48,gw-32,23);});const noteHeight=g.note?p.wrapped(g.note,x+16,y+284,gw-32,14,c.warm):0;goalBottom=Math.max(goalBottom,y+286+noteHeight);});y=goalBottom+16;
    if(s.levels.length){line(rx,y,rw);y+=29;txt('价格位置 · 等比例示意，非时间走势',rx,y,15,c.muted,rw);const lo=Math.min(...s.levels.map(v=>v.value)),hi=Math.max(...s.levels.map(v=>v.value));rect(rx+6,y+28,rw-12,1,c.line);s.levels.forEach(v=>rect(rx+6+(v.value-lo)/(hi-lo||1)*(rw-12)-4,y+24,8,8,c[v.tone]||c.ink,4));s.levels.forEach((v,i)=>txt(v.name+' '+v.text,rx+(i%2)*(rw/2+8),y+65+Math.floor(i/2)*26,16,c[v.tone]||c.ink,rw/2-12));y+=130;}
    let end=Math.max(leftEnd,y)+22;line(P,end,area);end+=31;if(s.warning)end+=p.wrapped(s.warning,P,end,area,16,c.warm)+16;
    if(!s.narrow)rect(P+lw+gap/2,136,1,Math.max(leftEnd,y)-136,c.line);
    return p.finish(p.footer(end,'仅为参数测算，不构成投资建议。'));
  }
  async function calcRender(s, helpers) {
    if(s.flow==='multi')return multiRender(s,helpers);
    if(s.flow==='position')return positionRender(s,helpers);
    const p = painter(s,helpers);await p.header();const {W,P,c,txt,rect,line,metric,row} = p;
    const area=W-P*2,gap=44,col=s.narrow ? area:380,rx=s.narrow ? P:P+col+gap,rw=s.narrow ? area:area-col-gap;
    let y=150;
    if(s.chips.length){let x=P;for(const chip of s.chips){const w=chip.length*18+34;rect(x,y-22,w,36,c.selected,9);txt(chip,x+17,y+2,17,c.ink,w-25);x+=w+10;}y+=54;}
    const py=y;txt('计算参数',P,y,22,c.ink,col);line(P,y+21,col);y+=60;
    // A share image records settled values, rather than suggesting editable fields.
    const paramGap=28,paramWidth=(col-paramGap)/2,paramStep=88;
    s.params.forEach((item,i)=>{const x=P+(i%2)*(paramWidth+paramGap),top=y+Math.floor(i/2)*paramStep;txt(item.name,x,top,17,c.muted,paramWidth);txt(item.value,x,top+35,26,c.ink,paramWidth,'left',500);});
    let cy=y+Math.ceil(s.params.length/2)*paramStep;
    if(s.riskTag){txt(s.riskTag,P+col,py,17,c.muted,130,'right');txt(s.stopHint,P,cy-4,17,c.muted,col);cy+=26;}
    let ry=s.narrow ? cy+35:py;
    txt('计算结果',rx,ry,22,c.ink,rw);line(rx,ry+21,rw);ry+=65;
    const mc=s.metrics.length===3&&!s.narrow ? 3:s.metrics.length===1 ? 1:2;
    const mw=(rw-24*(mc-1))/mc;
    s.metrics.forEach((item,i)=>metric(item,rx+(i%mc)*(mw+24),ry+Math.floor(i/mc)*114,mw));ry+=Math.ceil(s.metrics.length/mc)*114;
    if(s.status){ry+=p.wrapped(s.status,rx,ry,rw,18,c.muted)+22;}
    for(const group of s.groups){line(rx,ry,rw);ry+=37;txt(group.name,rx,ry,21,c.ink,rw-100);if(group.badge){rect(rx+rw-84,ry-24,84,34,c.selected,8);txt(group.badge,rx+rw-42,ry,17,c.text,75,'center');}ry+=47;for(const item of group.items){row(item,rx,ry,rw,19);ry+=44;}ry+=20;}
    if(s.warning){line(rx,ry,rw);ry+=32;ry+=p.wrapped(s.warning,rx,ry,rw);ry+=18;}
    const end=Math.max(cy,ry)+20;
    if(!s.narrow)rect(P+col+gap/2,py-20,1,Math.max(cy,ry)-py+20,c.line);
    return p.finish(p.footer(end,'仅为参数测算，不构成投资建议。'));
  }
  async function chartImage(snapshot, width, height, helpers) {
    const host=document.createElement('div');const chart=echarts.init(host,null,{renderer:'canvas',width,height,devicePixelRatio:2});
    try {const grid=snapshot.option.grid[0],path=snapshot.option.xAxis[0].type==='category',color=snapshot.option.yAxis[0].nameTextStyle?.color;
      const xAxis=snapshot.option.xAxis.map(a=>({...a,axisLabel:{...a.axisLabel,fontSize:13,...(a.type==='category'?{interval:Math.max(0,Math.ceil(((a.data?.length||1)-1)/10)-1),showMinLabel:true,showMaxLabel:true}:{})}})),yAxis=snapshot.option.yAxis.map(a=>({...a,axisLabel:{...a.axisLabel,fontSize:13}}));
      chart.setOption({...snapshot.option,xAxis,yAxis,legend:(snapshot.option.legend||[]).map(l=>({...l,show:false})),graphic:[{id:'onechart-axis-y',type:'text',left:Number(grid.left)+8,top:Number(grid.top)-6.5,silent:true,z:100,style:{text:path?'资金':'最终资金',fill:color,fontSize:13,fontWeight:500}},{id:'onechart-axis-x',type:'text',right:Number(grid.right)+8,bottom:Number(grid.bottom)+8,silent:true,z:100,style:{text:path?'交易次数':'相对密度',fill:color,fontSize:13,fontWeight:500}}],animation:false,backgroundColor:'transparent'});if(snapshot.areas.length)chart.dispatchAction({type:'brush',areas:snapshot.areas});chart.getZr().flush();return await helpers.image(chart.getDataURL({pixelRatio:2,backgroundColor:'transparent'}));}
    finally {chart.dispose();}
  }
  async function simuRender(s,helpers) {
    const p=painter(s,helpers);await p.header();const {W,P,c,txt,line,rect,control,row,draw}=p;const area=W-P*2;
    txt('2,000 次共同随机路径 · ' + s.basis,P,146,18,c.muted,area);
    const cols=s.narrow?2:6,gap=24,cw=(area-gap*(cols-1))/cols;
    s.params.forEach((item,i)=>control(item,P+(i%cols)*(cw+gap),192+Math.floor(i/cols)*133,cw));
    let y=192+Math.ceil(s.params.length/cols)*133+12;
    line(P,y,area);y+=46;
    const summaryWidth=s.narrow?area:(area-64)/2;
    const summaryHeight=150;
    s.summary.forEach((block,i)=>{const x=s.narrow?P:P+i*(summaryWidth+64),top=s.narrow?y+i*summaryHeight:y,valueWidth=p.measure(block.value,36,500),full=i===1;
      txt(full?'单笔建议风险敞口':block.name,x,top,19,c.muted,summaryWidth-valueWidth-(full?72:28));
      if(full)txt('满额',x+summaryWidth-valueWidth-14,top+3,16,c.muted,48,'right');
      txt(block.value,x+summaryWidth,top+7,36,p.tone(block),summaryWidth*.46,'right',500);
      block.items.forEach((item,j)=>{const yy=top+53+j*30;txt(item.name,x,yy,17,c.muted,summaryWidth*.62);txt(item.value,x+summaryWidth,yy,17,p.tone(item),summaryWidth*.54,'right',400);});
    });
    y+=(s.narrow?summaryHeight*2:summaryHeight);line(P,y,area);y+=43;txt('风险档位',P,y,23,c.ink,area);y+=35;txt(s.basisDescription,P,y,18,c.muted,area);y+=30;
    const count=s.narrow?2:s.rows.length>5?4:5,cardGap=14,cardW=(area-cardGap*(count-1))/count,cardH=168;
    s.rows.forEach((item,i)=>{const x=P+(i%count)*(cardW+cardGap),top=y+Math.floor(i/count)*(cardH+14);rect(x,top,cardW,cardH,item.active?c.selected:c.panel,12,item.active?item.color:'');rect(x+18,top+22,8,8,item.color,4);txt(item.name,x+34,top+33,17,c.ink,cardW-145,'left',500);txt(item.risk,x+cardW-16,top+35,25,c.ink,110,'right',500);item.items.forEach((entry,j)=>row(entry,x+18,top+68+j*26,cardW-36,15));});
    y+=Math.ceil(s.rows.length/count)*(cardH+14)+22;
    line(P,y,area);y+=39;txt(s.context,P,y,18,c.muted,area-200);txt(s.scale,W-P,y,16,c.muted,180,'right');y+=44;
    const chartGap=44,pathW=s.narrow?area:Math.floor((area-chartGap)/2),distW=s.narrow?area:area-pathW-chartGap,chartH=450;
    const headingPlan=(title,snapshot,width)=>{const legend=snapshot.option.legend?.[0],items=(legend?.data||[]).map(v=>{const name=typeof v==='string'?v:v.name,series=snapshot.option.series?.find(s=>s.name===name);return {name,width:p.measure(name,14)+14,active:legend.selected?.[name]!==false,color:legend.selected?.[name]===false?c.muted:series?.lineStyle?.color||series?.itemStyle?.color||c.muted};}),total=items.reduce((sum,v)=>sum+v.width,0)+Math.max(0,items.length-1)*12,inline=total<=width-2*(p.measure(title,20,500)+20),rows=[];let current=[],used=0;
      for(const item of items){if(current.length&&used+12+item.width>width-32){rows.push(current);current=[];used=0;}current.push(item);used+=(used?12:0)+item.width;}if(current.length)rows.push(current);
      return {title,width,rows,inline,extra:inline?0:rows.length*24};};
    const pathHeading=headingPlan('资金曲线',s.charts[0],pathW),distHeading=headingPlan('最终资金分布',s.charts[1],distW),headExtra=s.narrow?pathHeading.extra:Math.max(pathHeading.extra,distHeading.extra);
    const drawHeading=(plan,x,top)=>{txt(plan.title,x,top,20,c.ink,140,'left',500);plan.rows.forEach((entries,index)=>{const total=entries.reduce((sum,v)=>sum+v.width,0)+Math.max(0,entries.length-1)*12;let left=x+(plan.width-total)/2;const yy=top+(plan.inline?0:(index+1)*24);for(const item of entries){rect(left,yy-8,6,6,item.color,3);txt(item.name,left+14,yy,14,item.active?c.text:c.muted,item.width-13);left+=item.width+12;}});};
    drawHeading(pathHeading,P,y);const imageY=y+22+headExtra;
    const path=await chartImage(s.charts[0],pathW,chartH,helpers);p.image(path,P,imageY,pathW,chartH);
    const dy=s.narrow?imageY+chartH+46:y,dx=s.narrow?P:P+pathW+chartGap;
    drawHeading(distHeading,dx,dy);const distY=dy+22+(s.narrow?distHeading.extra:headExtra),dist=await chartImage(s.charts[1],distW,chartH,helpers);p.image(dist,dx,distY,distW,chartH);
    y=(s.narrow?distY:imageY)+chartH+30;
    if(s.range){y+=p.wrapped(s.range,P,y,area,18,c.text)+14;}
    if(s.details.length){line(P,y,area);y+=36;txt('高级样本详情',P,y,20,c.ink,area);y+=38;for(const item of s.details){row(item,P,y,area,18);y+=32;}y+=12;}
    return p.finish(p.footer(y,'模拟用于理解风险，不构成收益预测。'));
  }
  const kind=document.body.dataset.shareTool;
  const describe = s => s.kind==='calc' ? [s.title,...s.params.map(p=>p.name+' '+p.value),...s.metrics.map(p=>p.name+' '+p.value),...s.groups.flatMap(g=>g.items.map(p=>p.name+' '+p.value)),...(s.specs||[]).map(p=>p.name+' '+p.value),s.status||'',s.warning||''].join('；') : [s.title,s.basis,s.context,s.scale,...s.params.map(p=>p.name+' '+p.value),...s.rows.map(r=>r.name+' '+r.risk+(r.active?' · 已选':'')),s.range].filter(Boolean).join('；');
  function redact(snapshot,enabled){
    const s=structuredClone(snapshot);if(!enabled)return s;
    const walk=v=>{if(!v||typeof v!=='object')return;if(v.private){v.value='••••';if(v.note)v.note=v.note.replace(/[+−¥$]?\d[\d,.]*[%％]?/g,n=>/[%％]$/.test(n)?n:'••••');}for(const child of Object.values(v))if(child&&typeof child==='object')walk(child);};walk(s);
    if(s.warning)s.warning=s.warning.replace(/[+−¥$]?\d[\d,.]*/g,'••••');return s;
  }
  const boot=()=>{if(kind==='simu')compactSimuCharts();window.OneChartShare.mount({redact:kind==='calc'?redact:undefined,themeId:kind==='simu'?'themeToggle':'theme-toggle',capture:kind==='simu'?simuCapture:calcCapture,render:kind==='simu'?simuRender:calcRender,filename:s=>'OneChart-'+s.kind+(s.flow?'-'+s.flow:'')+(s.market?'-'+s.market+'-'+s.side:'')+'.png',describe});};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
