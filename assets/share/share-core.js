/* Local-first share shell. Page adapters own content; this module never requests business data. */
'use strict';
window.OneChartShare = (() => {
  const camera = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m8.25 6.5 1.5-2.25h4.5l1.5 2.25H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-10a2 2 0 0 1 2-2Z"/><circle cx="12" cy="12.75" r="3.25"/></svg>';
  function text(ctx, value, x, y, size, color, maxWidth, align = 'left', weight = 400) {
    ctx.font = `${weight} ${size}px -apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif`;ctx.fillStyle = color;ctx.textAlign = align;
    let label = String(value ?? '—');
    const unitMatch=label.match(/^(.+?)\s+USDT$/);
    if(unitMatch){
      ctx.save();const baseFont=ctx.font,unitSize=Math.max(8,Math.min(12,size*.5)),gap=size*.15;
      ctx.font=`400 ${unitSize}px -apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif`;const unitWidth=ctx.measureText('USDT').width;ctx.font=baseFont;
      let number=unitMatch[1];while(maxWidth&&number.length>1&&ctx.measureText(number).width+gap+unitWidth>maxWidth)number=number.slice(0,-2)+'…';
      const numberWidth=ctx.measureText(number).width,total=numberWidth+gap+unitWidth,start=align==='right'?x-total:align==='center'?x-total/2:x;
      ctx.textAlign='left';ctx.fillText(number,start,y);ctx.font=`400 ${unitSize}px -apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif`;ctx.globalAlpha*=.8;ctx.fillText('USDT',start+numberWidth+gap,y-size*.035);ctx.restore();return number+' USDT';
    }
    while (maxWidth && label.length > 1 && ctx.measureText(label).width > maxWidth) label = label.slice(0, -2) + '…';
    ctx.fillText(label, x, y);return label;
  }
  const image = source => new Promise((resolve, reject) => { const img = new Image();img.onload = () => resolve(img);img.onerror = () => reject(new Error('品牌素材加载失败，请重试。'));img.src = source; });
  function mount(adapter) {
    const theme = document.getElementById(adapter.themeId || 'theme-toggle');
    if (!theme || document.querySelector('[data-share-global]')) return;
    const tools = document.createElement('div');tools.className = 'share-global-tools';theme.before(tools);
    const trigger = document.createElement('button');trigger.type = 'button';trigger.className = 'share-trigger';trigger.dataset.shareGlobal = '';trigger.title = '截图分享';trigger.setAttribute('aria-label','截图分享');trigger.innerHTML = camera;tools.append(trigger,theme);
    const dialog = document.createElement('dialog');dialog.id = 'share-dialog';dialog.setAttribute('aria-labelledby','share-title');
    dialog.innerHTML = '<header class="share-heading"><div><h2 id="share-title">截图分享</h2><p>图片在浏览器本地生成，不自动上传。</p></div><button class="share-close" type="button" aria-label="关闭截图预览"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></header><div class="share-options"><span id="share-dimensions"></span></div><div class="share-preview"><img id="share-image" alt="截图分享预览" hidden><p id="share-status" role="status" aria-live="polite">正在生成截图…</p></div><footer class="share-actions"><p id="share-feedback" role="status" aria-live="polite"></p><div><button id="share-copy" type="button" disabled>复制图片</button><button id="share-system" type="button" disabled hidden>系统分享</button><button id="share-save" type="button" disabled>保存 PNG</button></div></footer>';
    if(adapter.redact){const privacy=document.createElement('label');privacy.innerHTML='<input id="share-privacy" type="checkbox">隐私遮挡（账户金额与数量）';dialog.querySelector('.share-options').prepend(privacy);}
    document.body.append(dialog);
    const $ = id => document.getElementById(id), output = $('share-image'), status = $('share-status'), feedback = $('share-feedback');
    const actions = ['share-copy','share-system','share-save'].map($);
    let snapshot = null, blob = null, url = '', generation = 0;
    async function update() {
      const token = ++generation;blob = null;output.hidden = true;status.hidden = false;status.textContent = '正在生成截图…';feedback.textContent = '';actions.forEach(button => button.disabled = true);
      try {
        const view=adapter.redact?adapter.redact(snapshot,document.getElementById('share-privacy').checked):snapshot;
        const canvas = await adapter.render(view, { text, image });
        const result = await new Promise((resolve,reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('图片编码失败，请重试。')), 'image/png'));
        if (token !== generation || !dialog.open) return;
        if (url) URL.revokeObjectURL(url);blob = result;url = URL.createObjectURL(blob);output.src = url;output.alt = adapter.describe(view);output.hidden = false;status.hidden = true;
        $('share-dimensions').textContent = `${canvas.width} × ${canvas.height} PNG`;
        actions.forEach(button => button.disabled = false);
        $('share-copy').hidden = !navigator.clipboard?.write || !window.ClipboardItem;
        $('share-system').hidden = !navigator.canShare?.({files:[new File([blob],'OneChart.png',{type:'image/png'})]});
      } catch (error) { if (token === generation) status.textContent = error.message || '生成失败，请关闭后重试。'; }
    }
    document.getElementById('share-privacy')?.addEventListener('change',()=>{if(snapshot)update();});
    trigger.onclick = () => {
      dialog.showModal();
      try { snapshot = adapter.capture();update(); }
      catch (error) { output.hidden = true;status.hidden = false;status.textContent = error.message;actions.forEach(button => button.disabled = true); }
    };
    dialog.querySelector('.share-close').onclick = () => dialog.close();
    // Escape must not also exit the page's existing selection/export state.
    dialog.addEventListener('keydown',event => { if (event.key === 'Escape') event.stopPropagation(); });
    dialog.addEventListener('close',() => { ++generation;snapshot = null;blob = null;if(url)URL.revokeObjectURL(url);url = '';output.removeAttribute('src');trigger.focus({preventScroll:true}); });
    const file = () => new File([blob],adapter.filename(snapshot),{type:'image/png'});
    $('share-save').onclick = () => { if(!blob)return;const link = document.createElement('a');link.href = url;link.download = file().name;link.click();feedback.textContent = '已交给浏览器保存。'; };
    $('share-copy').onclick = async () => { if(!blob)return;try { await navigator.clipboard.write([new ClipboardItem({'image/png':blob})]);feedback.textContent = '图片已复制。'; } catch { feedback.textContent = '浏览器未允许复制，请保存 PNG。'; } };
    $('share-system').onclick = async () => { if(!blob)return;try { await navigator.share({files:[file()]});feedback.textContent = '已交给系统分享。'; } catch(error) { feedback.textContent = error.name === 'AbortError' ? '已取消分享。' : '暂不能系统分享，请保存 PNG。'; } };
  }
  return { mount };
})();
