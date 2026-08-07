import { CancelledError, simulate, transferableBuffers } from './engine.mjs';
import { createLcg, createSeed } from './random.mjs';

let active = null;
let queued = null;

function yieldToMessages() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

async function run(request) {
  const token = { jobId: request.jobId, cancelled: false };
  active = token;
  const seed = Number.isInteger(request.seed) ? request.seed >>> 0 : createSeed();
  let lastProgressAt = 0;
  let lastPercent = -1;
  const stageWeights = { reverse:[0,12], paths:[12,65], aggregate:[65,90], distribution:[90,100] };
  try {
    const result = await simulate(request.params, createLcg(seed), {
      isCancelled: () => token.cancelled,
      yieldControl: yieldToMessages,
      onProgress(progress) {
        const [start,end] = stageWeights[progress.stage] || [0,100];
        const percent = Math.min(100, start + (end-start) * progress.completed / Math.max(1,progress.total));
        const now = performance.now();
        if (percent - lastPercent >= 1 || now - lastProgressAt >= 100) {
          lastPercent = percent; lastProgressAt = now;
          postMessage({ type:'progress', jobId:request.jobId, stage:progress.stage, percent });
        }
      }
    });
    if (token.cancelled) throw new CancelledError();
    postMessage({ type:'result', jobId:request.jobId, seed, result }, transferableBuffers(result));
  } catch (error) {
    if (error instanceof CancelledError || token.cancelled) postMessage({ type:'cancelled', jobId:request.jobId });
    else postMessage({ type:'error', jobId:request.jobId, message:error?.message || String(error) });
  } finally {
    if (active === token) active = null;
    if (queued) {
      const next = queued; queued = null;
      run(next);
    }
  }
}

self.addEventListener('message', event => {
  const message = event.data || {};
  if (message.type === 'cancel') {
    if (active && (!message.jobId || active.jobId === message.jobId)) active.cancelled = true;
    return;
  }
  if (message.type !== 'run') return;
  if (active) {
    active.cancelled = true;
    queued = message;
  } else run(message);
});
