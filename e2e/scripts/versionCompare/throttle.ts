import {type CDPSession} from '@playwright/test'

export interface NetworkConditions {
  /** Round-trip latency added to every request. */
  latencyMs: number
  downloadKbps: number
  uploadKbps: number
}

export interface ThrottleProfile {
  /** `null` leaves the network alone. */
  network: NetworkConditions | null
  /** 1 means no CPU throttling. */
  cpuThrottle: number
}

/**
 * The Chrome DevTools "Slow 4G" and "Fast 4G" presets, with the throughput taken at face value
 * (kbps / 8 bytes per second, no Lighthouse-style latency multiplier or throughput discount),
 * plus the CPU slowdown Lighthouse applies to mobile runs for the slow profile.
 */
export const PROFILES = {
  'fast-4g': {network: {downloadKbps: 9000, latencyMs: 60, uploadKbps: 1500}, cpuThrottle: 1},
  'none': {network: null, cpuThrottle: 1},
  'slow-4g': {network: {downloadKbps: 1600, latencyMs: 150, uploadKbps: 750}, cpuThrottle: 4},
} as const satisfies Record<string, ThrottleProfile>

export type ProfileName = keyof typeof PROFILES

export function isProfileName(value: string): value is ProfileName {
  return Object.hasOwn(PROFILES, value)
}

/** Emulates the profile for the whole page, with the HTTP cache off. Call before navigating. */
export async function applyThrottle(cdp: CDPSession, profile: ThrottleProfile): Promise<void> {
  await cdp.send('Network.enable')
  await cdp.send('Network.setCacheDisabled', {cacheDisabled: true})
  if (profile.network) {
    await cdp.send('Network.emulateNetworkConditions', {
      downloadThroughput: (profile.network.downloadKbps * 1000) / 8,
      latency: profile.network.latencyMs,
      offline: false,
      uploadThroughput: (profile.network.uploadKbps * 1000) / 8,
    })
  }
  if (profile.cpuThrottle > 1) {
    await cdp.send('Emulation.setCPUThrottlingRate', {rate: profile.cpuThrottle})
  }
}
