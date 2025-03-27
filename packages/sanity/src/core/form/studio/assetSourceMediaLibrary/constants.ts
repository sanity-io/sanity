import {isDev} from '../../../environment'

// TODO: change this to what the official GDR release version is
export const DEFAULT_API_VERSION = 'vX'

// Staging
export const DEPLOYED_FRONTEND_HOST_STAGING = 'https://media.sanity.work'
export const CDN_HOST_STAGING = 'https://sanity-cdn.work'
export const API_HOST_STAGING = 'https://api.sanity.work'

// Production
export const DEPLOYED_FRONTEND_HOST_PRODUCTION = 'https://media.sanity.io'
export const CDN_HOST_PRODUCTION = 'https://sanity-cdn.com'
export const API_HOST_PRODUCTION = 'https://api.sanity.io'

// Local dev Media Library server
export const IS_LOCAL_DEV = false && isDev // Set boolean to true to work against local Media Library dev server (but keep isDev check to avoid accidentally committing it)
export const LOCAL_DEV_FRONTEND_HOST = 'http://localhost:3001'
