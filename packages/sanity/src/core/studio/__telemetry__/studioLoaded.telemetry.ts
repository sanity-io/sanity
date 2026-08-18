import {defineEvent} from '@sanity/telemetry'

export interface StudioLoadedInfo {
  studioVersion: string
  reactVersion: string
  environment: 'production' | 'development'
  userAgent: string
  screenDensity: number
  screenHeight: number
  screenWidth: number
  screenInnerHeight: number
  screenInnerWidth: number
}

export const StudioLoaded = defineEvent<StudioLoadedInfo>({
  name: 'Studio Loaded',
  version: 1,
  description: 'Fired once per studio mount with studio version and environment metadata',
})
