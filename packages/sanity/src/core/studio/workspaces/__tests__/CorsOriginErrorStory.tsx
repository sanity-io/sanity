import {CorsOriginErrorScreen} from '../CorsOriginErrorScreen'

const SHARED = {
  isStaging: false,
  origin: 'https://cms.example.com',
  projectId: 'ppsg7ml5',
  primaryProjectId: 'ppsg7ml5',
} as const

/**
 * Chromatic sentinel for the CORS origin error screen after the ui5 Box
 * migration. Register vs credentials-disabled branches pair Box max-width
 * with Card/Button layout — a mix TypeScript will not catch. Origin and
 * project IDs are fixtures (no live CORS checks, no timestamps).
 */
export function CorsOriginErrorStory({
  variant = 'not-connected',
}: {
  variant?: 'not-connected' | 'credentials-disabled'
}) {
  if (variant === 'credentials-disabled') {
    return <CorsOriginErrorScreen {...SHARED} allowed withCredentials={false} />
  }

  return <CorsOriginErrorScreen {...SHARED} />
}
