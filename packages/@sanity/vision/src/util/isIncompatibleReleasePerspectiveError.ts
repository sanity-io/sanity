import {type ClientPerspective} from '@sanity/client'

const NAMED_PERSPECTIVES = new Set(['raw', 'published', 'drafts', 'previewDrafts'])

export function hasReleaseInPerspective(perspective: ClientPerspective | undefined): boolean {
  if (!Array.isArray(perspective)) {
    return false
  }

  return perspective.some((entry) => !NAMED_PERSPECTIVES.has(entry))
}

export function isApiVersionBelow(apiVersion: string, minimumApiVersion: string): boolean {
  const selected = apiVersion.replace(/^v/i, '').trim()
  const minimum = minimumApiVersion.replace(/^v/i, '').trim()

  if (!selected || selected.toUpperCase() === 'X') {
    return false
  }

  if (selected === '1') {
    return true
  }

  if (!isDatedApiVersion(selected) || !isDatedApiVersion(minimum)) {
    return false
  }

  return selected < minimum
}

export function isIncompatibleReleasePerspectiveError({
  statusCode,
  apiVersion,
  perspective,
  minimumApiVersion,
}: {
  statusCode: number | undefined
  apiVersion: string
  perspective: ClientPerspective | undefined
  minimumApiVersion: string
}): boolean {
  return (
    statusCode === 400 &&
    hasReleaseInPerspective(perspective) &&
    isApiVersionBelow(apiVersion, minimumApiVersion)
  )
}

function isDatedApiVersion(version: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(version)
}
