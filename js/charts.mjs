function theme() {
  const dark = document.documentElement.dataset.theme === 'dark';
  return dark
    ? { ink:'#f0f2f5', text:'#c9d0d8', muted:'#8f99a5', line:'#39424d', minor:'#232a32', paper:'#15191e', risk:'#e06a64', gain:'#48b89d' }
    : { ink:'#13161a', text:'#30363e', muted:'#6e7783', line:'#d9dee4', minor:'#eceff2', paper:'#ffffff', risk:'#c94742', gain:'#14715c' };
}
function money(value) {
  if (value <= 0.001) return '接近归零';
  if (value >= 1e12) return `${(value / 10 ** Math.floor(Math.log10(value))).toFixed(1)}×10^${Math.floor(Math.log10(value))}`;
  if (value >= 1e8) return `${(value/1e8).toFixed(2)}亿`;
  if (value >= 1e4) return `${(value/1e4).toFixed(2)}万`;
  return value.toFixed(1);
}
function bounds(result, selected, scale) {
  const rows = selected ? [selected] : result.strategies;
  let min = Math.min(...rows.map(row => row.absoluteMin));
  let max = Math.max(...rows.map(row => row.absoluteMax));
  if (!(min > 0) || min >= max) { min = 0.001; max = Math.max(100,max || 100); }
  return scale === 'full' ? { min,max } : { min:Math.max(0.001,min/3), max:Math.min(1e80,max*3) };
}
function percentile(values, ratio) {
  const sorted = Float64Array.from(values).sort();
  return sorted[Math.floor(sorted.length * ratio)];
}
function compactLegend(colors,data){
  return {show:true,top:1,type:'scroll',data,icon:'roundRect',itemWidth:12,itemHeight:3,itemGap:14,textStyle:{color:colors.muted,fontSize:10},pageIconSize:9,pageButtonItemGap:3,pageButtonGap:7,pageTextStyle:{color:colors.muted,fontSize:9}};
}

export function createCharts({ pathElement, distributionElement, onRange }) {
  const pathChart = echarts.init(pathElement);
  const distributionChart = echarts.init(distributionElement);
  let current = null;
  let selectedId = null;
  let scaleMode = 'focus';
  let distributionDensityMax = 1;
  const pathTooltip=document.createElement('div');pathTooltip.className='chart-tooltip';pathTooltip.hidden=true;pathElement.appendChild(pathTooltip);
  const distributionTooltip=document.createElement('div');distributionTooltip.className='chart-tooltip';distributionTooltip.hidden=true;distributionElement.appendChild(distributionTooltip);

  function showTooltip(element,tooltip,x,y,title,detail){
    tooltip.replaceChildren();const strong=document.createElement('strong');strong.textContent=title;const span=document.createElement('span');span.textContent=detail;tooltip.append(strong,span);tooltip.hidden=false;
    const left=Math.min(x+12,element.clientWidth-tooltip.offsetWidth-8);const top=Math.max(8,Math.min(y-12,element.clientHeight-tooltip.offsetHeight-8));tooltip.style.left=`${Math.max(8,left)}px`;tooltip.style.top=`${top}px`;
  }
  function hideTooltip(tooltip){tooltip.hidden=true}
  function closestLogIndex(data,target){let best=0,bestDistance=Infinity;const targetLog=Math.log(Math.max(.001,target));for(let i=0;i<data.length;i++){const distance=Math.abs(Math.log(Math.max(.001,data[i][1]))-targetLog);if(distance<bestDistance){best=i;bestDistance=distance}}return best}

  function renderPath() {
    if (!current) return;
    const colors = theme();
    const selected = current.strategies.find(row => row.id === selectedId) || null;
    const range = bounds(current,selected,scaleMode);
    const series = [];
    const legendData = [];
    if (!selected) {
      for (const row of current.strategies) {legendData.push(row.name);series.push({ name:row.name, type:'line', data:Array.from(row.median), symbol:'none', triggerLineEvent:true, lineStyle:{ color:row.color, width:2 }, itemStyle:{ color:row.color } });}
    } else {
      const paths = [
        ['最高样本',selected.maxPath,colors.ink,'dashed',1.3],
        ['P90',selected.p90,selected.color,'dotted',1.6],
        ['中位数',selected.median,selected.color,'solid',3],
        ['P10',selected.p10,selected.color,'dotted',1.6],
        ['最低样本',selected.minPath,colors.risk,'dashed',1.3]
      ];
      for (const [name,data,color,type,width] of paths) {legendData.push(name);series.push({ name,type:'line',data:Array.from(data),symbol:'none',triggerLineEvent:true,lineStyle:{color,type,width},itemStyle:{color} });}
      for (let i=0;i<selected.sampleCount;i++) {
        const start=i*selected.stride;
        series.push({ name:`样本 ${i+1}`,type:'line',data:Array.from(selected.samples.subarray(start,start+selected.stride)),symbol:'none',triggerLineEvent:true,lineStyle:{color:selected.color,width:.7,opacity:.12},emphasis:{lineStyle:{width:1.4,opacity:.8}},animation:false });
      }
    }
    series.push({ name:'起始资金',type:'line',data:[],markLine:{silent:true,symbol:'none',data:[{yAxis:100}],lineStyle:{color:colors.line},label:{formatter:'起始资金 100',color:colors.muted}} });
    pathChart.setOption({
      animation:false,backgroundColor:'transparent',
      tooltip:{show:false},
      grid:{left:58,right:30,top:28,bottom:44},
      legend:compactLegend(colors,legendData),
      xAxis:{type:'category',boundaryGap:false,data:Array.from({length:current.params.trades+1},(_,i)=>i),name:'交易次数',nameLocation:'middle',nameGap:28,nameTextStyle:{color:colors.text,fontSize:11,fontWeight:600},axisLabel:{color:colors.muted},axisLine:{lineStyle:{color:colors.line}},splitLine:{show:false}},
      yAxis:{type:'log',logBase:10,min:range.min,max:range.max,name:'资金',nameTextStyle:{color:colors.text,fontSize:11,fontWeight:600},axisLabel:{color:colors.muted,formatter:money},axisLine:{lineStyle:{color:colors.line}},splitLine:{lineStyle:{color:colors.line,type:'dashed'}},minorSplitLine:{show:true,lineStyle:{color:colors.minor,type:'dashed'}}},
      series
    },true);
  }

  function renderDistribution() {
    if (!current) return;
    const colors = theme();
    const selected = current.strategies.find(row => row.id === selectedId) || null;
    const rows = selected ? [selected] : current.strategies;
    let densityMax = 0;
    for (const row of rows) for (const value of row.distributionY) if (value > densityMax) densityMax=value;
    distributionDensityMax=densityMax||1;
    const series = rows.map(row => ({
      name:row.name,type:'line',symbol:'none',smooth:true,triggerLineEvent:true,
      data:Array.from(row.distributionX, (value,index)=>[row.distributionY[index],value]),
      lineStyle:{color:row.color,width:selected?2.5:1.8,opacity:selected?1:.75},itemStyle:{color:row.color},
      areaStyle:selected?{color:row.color,opacity:.08}:undefined
    }));
    if (selected) {
      const marks = [
        {name:'P10',yAxis:percentile(selected.finalValues,.1),lineStyle:{color:colors.risk,type:'dashed'}},
        {name:'P50',yAxis:percentile(selected.finalValues,.5),lineStyle:{color:selected.color,type:'dashed'}},
        {name:'P90',yAxis:percentile(selected.finalValues,.9),lineStyle:{color:colors.gain,type:'dashed'}}
      ];
      series.push({name:'分位标记',type:'line',data:[],markLine:{symbol:'none',data:marks,label:{color:colors.muted,formatter:p=>`${p.name} $${money(p.value)}`}}});
    }
    const range = bounds(current,selected,scaleMode);
    distributionChart.setOption({
      animation:false,backgroundColor:'transparent',
      tooltip:{show:false},
      brush:{toolbox:['clear'],yAxisIndex:0,brushMode:'single',brushStyle:{borderWidth:1,borderColor:colors.ink,color:'rgba(85,125,168,.12)'}},
      grid:{left:68,right:30,top:28,bottom:44},
      legend:compactLegend(colors,rows.map(row=>row.name)),
      xAxis:{type:'value',max:densityMax,name:'相对密度',nameLocation:'middle',nameGap:28,nameTextStyle:{color:colors.text,fontSize:11,fontWeight:600},axisLabel:{color:colors.muted,formatter:value=>densityMax?`${(value/densityMax*100).toFixed(0)}%`:'0%'}, axisLine:{lineStyle:{color:colors.line}},splitLine:{lineStyle:{color:colors.line}}},
      yAxis:{type:'log',logBase:10,min:range.min,max:range.max,name:'最终资金',nameTextStyle:{color:colors.text,fontSize:11,fontWeight:600},axisLabel:{color:colors.muted,formatter:money},axisLine:{lineStyle:{color:colors.line}},splitLine:{lineStyle:{color:colors.line,type:'dashed'}},minorSplitLine:{show:true,lineStyle:{color:colors.minor,type:'dashed'}}},
      series
    },true);
    distributionChart.dispatchAction({type:'takeGlobalCursor',key:'brush',brushOption:{brushType:'lineY',brushMode:'single'}});
  }

  pathChart.getZr().on('mousemove',event=>{
    const pixel=[event.offsetX,event.offsetY];if(!current||!pathChart.containPixel({gridIndex:0},pixel)){hideTooltip(pathTooltip);return}
    const option=pathChart.getOption();const coordinate=pathChart.convertFromPixel({xAxisIndex:0,yAxisIndex:0},pixel);const dataIndex=Math.max(0,Math.min(current.params.trades,Math.round(Number(coordinate[0]))));let nearest=null;
    option.series.forEach((series,seriesIndex)=>{if(!series.data?.length)return;const raw=series.data[dataIndex];const value=Number(raw?.value??raw);if(!Number.isFinite(value)||value<=0)return;const point=pathChart.convertToPixel({xAxisIndex:0,yAxisIndex:0},[dataIndex,value]);const distance=Math.hypot(point[0]-pixel[0],point[1]-pixel[1]);if(!nearest||distance<nearest.distance)nearest={seriesIndex,name:series.name,value,distance}});
    if(nearest&&nearest.distance<=18)showTooltip(pathElement,pathTooltip,event.offsetX,event.offsetY,nearest.name,`第 ${dataIndex} 笔 · $${money(nearest.value)}`);else hideTooltip(pathTooltip);
  });
  pathChart.getZr().on('globalout',()=>hideTooltip(pathTooltip));
  distributionChart.getZr().on('mousemove',event=>{
    const pixel=[event.offsetX,event.offsetY];if(!current||!distributionChart.containPixel({gridIndex:0},pixel)){hideTooltip(distributionTooltip);return}
    const option=distributionChart.getOption();const coordinate=distributionChart.convertFromPixel({xAxisIndex:0,yAxisIndex:0},pixel);let nearest=null;
    option.series.forEach(series=>{if(!series.data?.length)return;const data=series.data.map(item=>item?.value??item);const dataIndex=closestLogIndex(data,coordinate[1]);const value=data[dataIndex];if(!Array.isArray(value)||value.length<2)return;const point=distributionChart.convertToPixel({xAxisIndex:0,yAxisIndex:0},value);const distance=Math.hypot(point[0]-pixel[0],point[1]-pixel[1]);if(!nearest||distance<nearest.distance)nearest={name:series.name,value,distance}});
    if(nearest&&nearest.distance<=18)showTooltip(distributionElement,distributionTooltip,event.offsetX,event.offsetY,nearest.name,`资金 $${money(nearest.value[1])} · 相对密度 ${(Number(nearest.value[0])/distributionDensityMax*100).toFixed(1)}%`);else hideTooltip(distributionTooltip);
  });
  distributionChart.getZr().on('globalout',()=>hideTooltip(distributionTooltip));

  distributionChart.on('brushEnd',event => {
    const area=event.areas?.[0];
    if (!area || !current) { onRange?.(null); return; }
    const low=Math.min(...area.coordRange), high=Math.max(...area.coordRange);
    const selected=current.strategies.find(row=>row.id===selectedId);
    const rows=selected?[selected]:current.strategies;
    let total=0,count=0;
    for(const row of rows) for(const value of row.finalValues){total++;if(value>=low&&value<=high)count++;}
    onRange?.({low,high,probability:total?count/total*100:0});
  });
  pathChart.getZr().on('dblclick',()=>{scaleMode=scaleMode==='focus'?'full':'focus';renderPath();renderDistribution();});
  distributionChart.getZr().on('dblclick',()=>{scaleMode=scaleMode==='focus'?'full':'focus';renderPath();renderDistribution();});

  return {
    setResult(result){current=result;selectedId=null;renderPath();renderDistribution();},
    selectStrategy(id){selectedId=selectedId===id?null:id;renderPath();renderDistribution();},
    clearSelection(){selectedId=null;renderPath();renderDistribution();},
    toggleScale(){scaleMode=scaleMode==='focus'?'full':'focus';renderPath();renderDistribution();return scaleMode;},
    clearRange(){distributionChart.dispatchAction({type:'brush',areas:[]});onRange?.(null);},
    refreshTheme(){renderPath();renderDistribution();},
    resize(){pathChart.resize();distributionChart.resize();},
    getState(){return {selectedId,scaleMode};}
  };
}
