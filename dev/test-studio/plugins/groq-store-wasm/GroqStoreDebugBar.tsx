import {useState, useSyncExternalStore, type CSSProperties} from 'react'
import {type LayoutProps} from 'sanity'

import {
  getGroqStoreStatus,
  setGroqStoreEnabled,
  subscribeGroqStoreStatus,
  type GroqStoreStatus,
} from './groqStore'

const bar: CSSProperties = {
  position: 'fixed',
  left: 8,
  bottom: 8,
  zIndex: 100_000,
  maxWidth: 'calc(100vw - 16px)',
  padding: '4px 8px',
  borderRadius: 6,
  background: 'rgba(20, 20, 24, 0.88)',
  color: '#eee',
  font: '11px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace',
  boxShadow: '0 1px 4px rgba(0, 0, 0, 0.3)',
  textAlign: 'left',
}
const plain: CSSProperties = {
  all: 'unset',
  cursor: 'pointer',
  userSelect: 'none',
}
const toggle: CSSProperties = {
  ...plain,
  marginTop: 4,
  padding: '0 6px',
  borderRadius: 4,
  border: '1px solid #666',
}

const dot = (color: string): CSSProperties => ({color, marginRight: 4})
const mib = (bytes?: number): string => ((bytes ?? 0) / 1024 / 1024).toFixed(1)

/** Why the store can't accelerate this tab at all, if it can't. */
function blocker(status: GroqStoreStatus): string | undefined {
  if (!status.boot.started) return status.boot.reason
  if (status.store === 'failed') return `wasm store failed: ${status.storeError ?? ''}`
  if (!status.controlled) return 'no service worker controls this tab (reload)'
  return undefined
}

function Latency({status}: {status: GroqStoreStatus}) {
  if (status.latency.count === 0) return null
  return (
    <span>
      {' · '}query p50 {Math.round(status.latency.p50)} ms / p95 {Math.round(status.latency.p95)} ms
    </span>
  )
}

function Details({status}: {status: GroqStoreStatus}) {
  const reasons = Object.entries(status.reasons).toSorted(([, a], [, b]) => b - a)
  const average = status.answered === 0 ? 0 : status.answerMs / status.answered
  const fenceAverage = status.fences.lifted === 0 ? 0 : status.fences.ms / status.fences.lifted
  const fenceMix = Object.entries(status.fences.how)
    .map(([how, count]) => `${how} ${count}`)
    .join(', ')
  return (
    <div style={{marginTop: 4, whiteSpace: 'pre-wrap'}}>
      <div>
        query latency (all /data/query, resource timing): {status.latency.count} requests, p50{' '}
        {status.latency.p50.toFixed(1)} ms, p95 {status.latency.p95.toFixed(1)} ms
      </div>
      {status.enabled ? (
        <>
          <div>store: {status.store}</div>
          {status.lastStopped === undefined ? null : (
            <div>
              last run: reached {mib(status.lastStopped.exportBytes)} MiB export /{' '}
              {mib(status.lastStopped.memoryBytes)} MiB wasm, then stopped
            </div>
          )}
          {status.storeError === undefined ? null : <div>error: {status.storeError}</div>}
          <div>
            listener: {status.mutations.applied} applied, {status.mutations.stale} stale
          </div>
          <div>wasm avg: {average.toFixed(1)} ms (incl. worker round trip)</div>
          <div>
            fences: {status.fences.count}, avg lift {fenceAverage.toFixed(1)} ms
            {fenceMix === '' ? '' : ` (${fenceMix})`}
          </div>
          <div>service worker: {status.controlled ? 'controlling' : 'not controlling'}</div>
          {reasons.length === 0 ? null : <div>not answered because:</div>}
          {reasons.map(([reason, count]) => (
            <div key={reason}>
              {'  '}
              {count}× {reason}
            </div>
          ))}
        </>
      ) : (
        <div>store: {status.boot.started ? 'on' : status.boot.reason}</div>
      )}
      <button
        type="button"
        style={toggle}
        onClick={() => setGroqStoreEnabled(!status.enabled)}
        title="Remembered in this browser; ?groqStore=on|off does the same"
      >
        {status.enabled ? 'switch store off (reload)' : 'switch store on (reload)'}
      </button>
    </div>
  )
}

/** Counts this tab's `/data/query` requests by who answered them. Click to expand. */
function GroqStoreDebugBar() {
  const status = useSyncExternalStore(subscribeGroqStoreStatus, getGroqStoreStatus)
  const [open, setOpen] = useState(false)
  // Keep the fixed overlay off when the store is off (e2e / webdriver, env, or toggle) so it
  // does not sit over the studio's bottom-left chrome and intercept clicks. Re-enable with
  // `?groqStore=on`.
  if (!status.enabled) return null
  const blocked = blocker(status)
  return (
    <div style={bar} data-testid="groq-store-wasm-debug-bar">
      <button
        type="button"
        style={plain}
        onClick={() => setOpen((value) => !value)}
        title="groq-store-wasm: click for details"
      >
        <span style={dot('#4ade80')}>●</span>wasm {status.answered}
        {' · '}
        <span style={dot('#facc15')}>●</span>passthrough {status.passthrough}
        {' · '}
        <span style={dot('#f87171')}>●</span>no accel {status.unaccelerated}
        <Latency status={status} />
        {status.store === 'building' && status.progress ? (
          <span>
            {' · '}export {mib(status.progress.exportBytes)} MiB · wasm{' '}
            {mib(status.progress.memoryBytes)} MiB
          </span>
        ) : status.store.startsWith('live') && status.progress?.memoryBytes !== undefined ? (
          <span> · wasm {mib(status.progress.memoryBytes)} MiB</span>
        ) : null}
        {status.guardOff ? <span style={{color: '#f59e0b'}}> · guard off</span> : null}
        {blocked === undefined ? null : <span style={{color: '#f87171'}}> · {blocked}</span>}
      </button>
      {open ? <Details status={status} /> : null}
    </div>
  )
}

/** Studio layout that adds the debug bar on top of the layout it wraps. */
export function GroqStoreDebugLayout(props: LayoutProps) {
  return (
    <>
      {props.renderDefault(props)}
      <GroqStoreDebugBar />
    </>
  )
}
