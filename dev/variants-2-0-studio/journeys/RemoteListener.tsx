import {useEffect, useRef} from 'react'
import {useRouter, useRouterState} from 'sanity/router'

import {getConfig} from '../design-options/config'
import {TAB_ID} from '../design-options/tab'
import {applyPreset, getOptionState, resetOptions, resetOverrides, resolveOption, setDimensionLimit, setGlobalChoice, setOverride, setShape, setStage, useOptionState} from '../design-options/store'

// The studio end of the Journeys remote (static/remote.html, opened in another window of the same origin). Mounted once
// with the Design options window, whether or not the Journeys panel is open. Commands arrive on a BroadcastChannel
// (same origin only, by construction of the channel; the origin is also checked in the message). Every message has an id:
// the studio ignores its own messages and any id it has already handled, so the two ends cannot feed each other.

export const REMOTE_CHANNEL = 'variants-2-0-remote'

export type RemoteMessage =
  | {id: string; from: 'remote'; origin: string; type: 'hello'}
  | {id: string; from: 'remote'; origin: string; type: 'go'; preset?: string; route?: string}
  | {id: string; from: 'remote'; origin: string; type: 'preset'; preset: string}
  | {id: string; from: 'remote'; origin: string; type: 'stage'; stage: string}
  | {id: string; from: 'remote'; origin: string; type: 'global'; choice: 'final' | 'stock' | number}
  | {id: string; from: 'remote'; origin: string; type: 'option'; component: string; option: string | null}
  | {id: string; from: 'remote'; origin: string; type: 'dimensions'; limit: number | null}
  | {id: string; from: 'remote'; origin: string; type: 'shape'; shape: 'round' | 'box'}
  | {id: string; from: 'remote'; origin: string; type: 'reset'; all?: boolean}
  | {id: string; from: 'remote'; origin: string; type: 'identify'}

export interface StudioStatus {
  id: string
  from: 'studio'
  origin: string
  type: 'status'
  /** The command this status answers, when it does. */
  reply?: string
  /** The tab that sent this status, when it last was active (ms), and whether it is visible. */
  tab: string
  activeAt: number
  visible: boolean
  /** The path the command was meant to reach, and whether this tab is there now (an answer to a `go`). */
  wanted?: string
  reached?: boolean
  preset?: string
  stage: string
  path: string
  /** The Design options state, for the options remote: Show, dimension limit and each component's chosen option. */
  options: {
    global: 'final' | 'stock' | number
    shape: 'round' | 'box'
    dimensionLimit: number | null
    stages: {id: string; label: string}[]
    dimensions: {value: number | null; label: string}[]
    presets: {id: string; name: string}[]
    components: {id: string; title: string; chosen: string; options: {id: string; label: string}[]}[]
  }
}

// Several studio tabs can listen at once. Rule: a command carries the tab it is for (the remote picks the tab that was
// active most recently: clicked or typed in, or the one that opened the remote); the other tabs ignore it. A command without a target is for every tab.
let activeAt = Date.now()
const markActive = () => {
  activeAt = Date.now()
}
if (typeof window !== 'undefined') {
  // `focus` is left out on purpose: Presentation and other iframes grab focus on their own, which made a background tab look active.
  for (const name of ['pointerdown', 'keydown']) window.addEventListener(name, markActive, true)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') markActive()
  })
}

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

export function RemoteListener() {
  const router = useRouter()
  const routerState = useRouterState((s) => s)
  const optionState = useOptionState()
  const channel = useRef<BroadcastChannel | null>(null)
  const seen = useRef(new Set<string>())
  const routerRef = useRef(router)
  routerRef.current = router

  const status = (reply?: string, wanted?: string): StudioStatus => {
    const now = getOptionState()
    const path = window.location.pathname + window.location.search
    return {id: newId(), from: 'studio', origin: window.location.origin, type: 'status', reply, tab: TAB_ID, activeAt, visible: document.visibilityState === 'visible', wanted, reached: wanted === undefined ? undefined : path.split('?')[0].startsWith(wanted.split('?')[0]), preset: now.preset ?? undefined, stage: now.stage, path: window.location.pathname + window.location.search,
      options: {
        global: now.global,
        shape: now.shape,
        dimensionLimit: now.dimensionLimit,
        stages: getConfig().scenario.stages,
        dimensions: (getConfig().scenario.dimensions ?? []).map((d) => ({value: d.value, label: d.label})),
        presets: getConfig().presets.map((p) => ({id: p.id, name: p.name})),
        components: getConfig().components.map((c) => ({id: c.id, title: c.title, chosen: resolveOption(c, now), options: c.options.map((o) => ({id: o.id, label: o.label}))})),
      },
    }
  }
  const post = (reply?: string, wanted?: string) => channel.current?.postMessage(status(reply, wanted))

  useEffect(() => {
    const bc = new BroadcastChannel(REMOTE_CHANNEL)
    channel.current = bc
    bc.onmessage = (event: MessageEvent<RemoteMessage>) => {
      const m = event.data
      if (!m || m.from !== 'remote' || m.origin !== window.location.origin || seen.current.has(m.id)) return
      seen.current.add(m.id)
      if ((m as {target?: string}).target && (m as {target?: string}).target !== TAB_ID) return
      if (m.type === 'identify') {
        // Shows which studio tab the remote is driving: a banner for a few seconds.
        const banner = document.createElement('div')
        banner.textContent = 'The Journeys remote is controlling this tab'
        banner.style.cssText = 'position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:2147483647;background:#4a54e8;color:#fff;padding:8px 14px;border-radius:6px;font:13px system-ui;box-shadow:0 4px 16px rgba(0,0,0,.3)'
        document.body.append(banner)
        window.setTimeout(() => banner.remove(), 3000)
      } else if (m.type === 'go') {
        if (m.preset) applyPreset(m.preset)
        if (m.route) routerRef.current.navigateUrl({path: m.route})
      } else if (m.type === 'preset') applyPreset(m.preset)
      else if (m.type === 'stage') setStage(m.stage)
      else if (m.type === 'global') setGlobalChoice(m.choice)
      else if (m.type === 'shape') setShape(m.shape)
      else if (m.type === 'option') setOverride(m.component, m.option)
      else if (m.type === 'dimensions') setDimensionLimit(m.limit)
      else if (m.type === 'reset') (m.all ? resetOptions : resetOverrides)()
      // The route changes on the next tick; answer after it, and again from the effect below when the path moves.
      window.setTimeout(() => post(m.id, m.type === 'go' ? m.route : undefined), 500)
    }
    post()
    return () => {
      bc.close()
      channel.current = null
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- the channel lives as long as the studio
  }, [])

  // Report whenever the route or the option state changes.
  useEffect(() => {
    post()
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- `post` only reads refs and the store
  }, [routerState, optionState])
  useEffect(() => {
    const id = window.setInterval(() => post(), 1000)
    return () => window.clearInterval(id)
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- `post` only reads refs and the store
  }, [])
  return null
}
