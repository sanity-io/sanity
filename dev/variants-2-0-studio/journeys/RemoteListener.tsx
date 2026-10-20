import {useEffect, useRef} from 'react'
import {useRouter, useRouterState} from 'sanity/router'

import {applyPreset, getOptionState, setStage} from '../design-options/store'

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

export interface StudioStatus {
  id: string
  from: 'studio'
  origin: string
  type: 'status'
  /** The command this status answers, when it does. */
  reply?: string
  preset?: string
  stage: string
  path: string
}

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

export function RemoteListener() {
  const router = useRouter()
  const routerState = useRouterState((s) => s)
  const channel = useRef<BroadcastChannel | null>(null)
  const seen = useRef(new Set<string>())
  const routerRef = useRef(router)
  routerRef.current = router

  const status = (reply?: string): StudioStatus => {
    const now = getOptionState()
    return {id: newId(), from: 'studio', origin: window.location.origin, type: 'status', reply, preset: now.preset ?? undefined, stage: now.stage, path: window.location.pathname + window.location.search}
  }
  const post = (reply?: string) => channel.current?.postMessage(status(reply))

  useEffect(() => {
    const bc = new BroadcastChannel(REMOTE_CHANNEL)
    channel.current = bc
    bc.onmessage = (event: MessageEvent<RemoteMessage>) => {
      const m = event.data
      if (!m || m.from !== 'remote' || m.origin !== window.location.origin || seen.current.has(m.id)) return
      seen.current.add(m.id)
      if (m.type === 'go') {
        if (m.preset) applyPreset(m.preset)
        if (m.route) routerRef.current.navigateUrl({path: m.route})
      } else if (m.type === 'preset') applyPreset(m.preset)
      else if (m.type === 'stage') setStage(m.stage)
      // The route changes on the next tick; answer after it, and again from the effect below when the path moves.
      window.setTimeout(() => post(m.id), 400)
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
  }, [routerState])
  useEffect(() => {
    const id = window.setInterval(() => post(), 3000)
    return () => window.clearInterval(id)
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- `post` only reads refs and the store
  }, [])
  return null
}
