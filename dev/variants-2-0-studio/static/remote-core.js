// Shared by the two remotes. Talks to the studio tabs over a BroadcastChannel (same origin only).
// Rule for several studio tabs: commands go to ONE tab, the one that was active most recently (focus, click or key);
// the status line shows that tab. The other tabs ignore the command.
export const CHANNEL = 'variants-2-0-remote'
const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

export function connect(onChange) {
  // The studio tab to drive: the one that opened this remote (?tab=), or one picked by hand, else the most recently active.
  let chosen = new URLSearchParams(location.search).get('tab') || sessionStorage.getItem('variants-2-0-remote-tab') || null
  const bc = new BroadcastChannel(CHANNEL)
  const seen = new Set()
  const tabs = new Map() // tab id -> {status, at}
  const acks = new Map() // command id -> resolver
  const live = () => [...tabs.values()].filter((t) => Date.now() - t.at < 7000)
  const sorted = () => live().sort((a, b) => (b.status.visible - a.status.visible) || (b.status.activeAt - a.status.activeAt)).map((t) => t.status)
  const born = Date.now()
  // A tab that opened this remote is waited for during the first seconds; after that, if it is gone, any live tab will do.
  const target = () => sorted().find((s) => s.tab === chosen) ?? (chosen && Date.now() - born < 8000 ? null : sorted()[0] ?? null)
  bc.onmessage = (event) => {
    const m = event.data
    if (!m || m.from !== 'studio' || m.origin !== location.origin || m.type !== 'status' || seen.has(m.id)) return
    seen.add(m.id)
    tabs.set(m.tab, {status: m, at: Date.now()})
    if (m.reply && acks.has(m.reply)) { acks.get(m.reply)(m); acks.delete(m.reply) }
    onChange()
  }
  /** Send a command to the active studio tab. Resolves with that tab's answer (or null after 4 s). */
  function send(message) {
    const id = newId()
    const t = target()
    const aim = chosen ?? t?.tab
    bc.postMessage({id, from: 'remote', origin: location.origin, ...(aim ? {target: aim} : {}), ...message})
    return new Promise((resolve) => {
      acks.set(id, resolve)
      setTimeout(() => { if (acks.delete(id)) resolve(null) }, 4000)
    })
  }
  const hello = () => bc.postMessage({id: newId(), from: 'remote', origin: location.origin, type: 'hello'})
  setInterval(() => { hello(); onChange() }, 1000)
  hello()
  const choose = (tab) => { chosen = tab || null; try { tab ? sessionStorage.setItem('variants-2-0-remote-tab', tab) : sessionStorage.removeItem('variants-2-0-remote-tab') } catch {} ; onChange() }
  return {send, target, tabCount: () => live().length, tabs: sorted, choose, chosen: () => chosen}
}

/** The one-line status: tab, preset, stage and the studio's live path. */
export function statusLine(core) {
  const s = core.target()
  const n = core.tabCount()
  return s ? `${n > 1 ? `${n} studio tabs, driving the one you picked or the most recently active · ` : ''}preset ${s.preset ?? '(custom)'} · stage ${s.stage} · ${s.path}` : 'No studio window found. Open the studio in another window of this browser.'
}
