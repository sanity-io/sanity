import {useTheme_v2 as useThemeV2} from '@sanity/ui'
import {type COBEOptions, type Marker} from 'cobe'
import {useEffect, useRef} from 'react'

import {type ApproximateLocation} from '../../util/timeZoneLocation'

const SIZE = 168

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
 * not animated; without WebGL it stays blank and the text next to it says the same.
 */
export function NetworkGlobe({you, api, reachedApi}: NetworkGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dark = useThemeV2().color._dark

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || (!you && !api)) return undefined
    let cancelled = false
    let destroy: (() => void) | undefined
    const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2)
    const focus = you && api ? midpoint(you, api) : (you ?? api)
    const markers: Marker[] = []
    if (you) markers.push({location: [you.latitude, you.longitude], size: 0.06, color: YOU_COLOR})
    if (api) markers.push({location: [api.latitude, api.longitude], size: 0.08})
    void loadCobe()
      .then(({default: createGlobe}) => {
        if (cancelled || !focus) return
        const options: COBEOptions = {
          width: SIZE * devicePixelRatio,
          height: SIZE * devicePixelRatio,
          devicePixelRatio,
          ...facing(focus),
          dark: dark ? 1 : 0,
          diffuse: 1.2,
          mapSamples: 12_000,
          mapBrightness: dark ? 4 : 6,
          baseColor: dark ? [0.32, 0.32, 0.36] : [0.96, 0.96, 0.97],
          markerColor: API_COLOR,
          glowColor: dark ? [0.25, 0.25, 0.3] : [0.92, 0.92, 0.95],
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
          globe.update({})
          destroy = () => globe.destroy()
        } catch {
          // No WebGL: the globe stays blank
        }
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
      destroy?.()
    }
  }, [api, dark, reachedApi, you])

  return (
    <canvas
      aria-hidden
      data-testid="vista-network-globe"
      ref={canvasRef}
      style={{width: SIZE, height: SIZE, flexShrink: 0}}
    />
  )
}
