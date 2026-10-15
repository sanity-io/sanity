import {useTheme_v2 as useThemeV2} from '@sanity/ui'
import {type COBEOptions, type Marker} from 'cobe'
import {useEffect, useRef} from 'react'

import {type ApproximateLocation} from '../../util/timeZoneLocation'

const SIZE = 168
const SETTLE_MS = 1200

/** cobe draws the globe; it is only fetched once the Network panel shows a response */
const loadCobe = () => import('cobe')
const YOU_COLOR: [number, number, number] = [0.25, 0.55, 1]
const API_COLOR: [number, number, number] = [1, 0.45, 0.2]

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/** The point halfway between two places on the sphere, so both are in view */
function midpoint(a: ApproximateLocation, b: ApproximateLocation): ApproximateLocation {
  const vector = [a, b].map(({latitude, longitude}) => [
    Math.cos(toRadians(latitude)) * Math.cos(toRadians(longitude)),
    Math.cos(toRadians(latitude)) * Math.sin(toRadians(longitude)),
    Math.sin(toRadians(latitude)),
  ])
  const [x, y, z] = [0, 1, 2].map((axis) => vector[0][axis] + vector[1][axis])
  return {
    latitude: (Math.atan2(z, Math.hypot(x, y)) * 180) / Math.PI,
    longitude: (Math.atan2(y, x) * 180) / Math.PI,
  }
}

/** cobe's rotation that faces a place (its README's `locationToAngles`) */
function facing({latitude, longitude}: ApproximateLocation): {phi: number; theta: number} {
  return {phi: Math.PI - (toRadians(longitude) - Math.PI / 2), theta: toRadians(latitude)}
}

export interface NetworkGlobeProps {
  /** Roughly where the browser is */
  you: ApproximateLocation | undefined
  /** Where the query ran */
  api: ApproximateLocation | undefined
  /** The query went all the way to the API, rather than being answered by the CDN near you */
  reachedApi: boolean
}

/**
 * A globe with you and the region the query ran in, and an arc between them when the request
 * travelled there. cobe draws with WebGL on each `update`, so it is drawn once per change and
 * not animated; without WebGL it stays blank and the text next to it says the same. cobe moves
 * its canvas around in the DOM and a destroyed globe leaves it unusable, so each picture gets a
 * canvas of its own that React does not manage.
 */
export function NetworkGlobe({you, api, reachedApi}: NetworkGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const dark = useThemeV2().color._dark

  useEffect(() => {
    const container = containerRef.current
    if (!container || (!you && !api)) return undefined
    const canvas = document.createElement('canvas')
    canvas.style.width = `${SIZE}px`
    canvas.style.height = `${SIZE}px`
    container.append(canvas)
    let cancelled = false
    let destroy: (() => void) | undefined
    // Drawn at twice the size at least, so the map's dots stay visible this small
    const devicePixelRatio = Math.max(window.devicePixelRatio || 1, 2)
    const focus = you && api ? midpoint(you, api) : (you ?? api)
    const markers: Marker[] = []
    if (you) markers.push({location: [you.latitude, you.longitude], size: 0.06, color: YOU_COLOR})
    if (api) markers.push({location: [api.latitude, api.longitude], size: 0.08})
    void loadCobe()
      .then(({default: createGlobe}) => {
        if (cancelled || !focus) return
        const from = facing(you ?? focus)
        const to = facing(focus)
        const options: COBEOptions = {
          // cobe sizes the canvas in device pixels from these
          width: SIZE,
          height: SIZE,
          devicePixelRatio,
          ...from,
          // Light dots on a dark sphere, which reads at this size on either background
          dark: 1,
          diffuse: 1.2,
          mapSamples: 16_000,
          mapBrightness: 6,
          baseColor: [0.3, 0.3, 0.34],
          markerColor: API_COLOR,
          glowColor: dark ? [0.2, 0.2, 0.24] : [0.86, 0.87, 0.9],
          markers,
          arcs:
            you && api && reachedApi
              ? [{from: [you.latitude, you.longitude], to: [api.latitude, api.longitude]}]
              : [],
          arcColor: API_COLOR,
          arcWidth: 0.8,
          arcHeight: 0.3,
        }
        try {
          const globe = createGlobe(canvas, options)
          // The globe turns from you to the way the query took, and stops: drawing for a moment
          // also picks up the map texture, which cobe loads after the first frame
          const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
          const started = performance.now()
          let frame = 0
          const draw = (now: number) => {
            const progress = Math.min((now - started) / SETTLE_MS, 1)
            const eased = reduceMotion ? 1 : 1 - (1 - progress) ** 3
            globe.update({
              phi: from.phi + (to.phi - from.phi) * eased,
              theta: from.theta + (to.theta - from.theta) * eased,
            })
            if (progress < 1) frame = requestAnimationFrame(draw)
          }
          frame = requestAnimationFrame(draw)
          destroy = () => {
            cancelAnimationFrame(frame)
            globe.destroy()
          }
        } catch {
          // No WebGL: the globe stays blank
        }
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
      destroy?.()
      container.replaceChildren()
    }
  }, [api, dark, reachedApi, you])

  return (
    <div
      aria-hidden
      data-testid="vista-network-globe"
      ref={containerRef}
      style={{width: SIZE, height: SIZE, flexShrink: 0}}
    />
  )
}
