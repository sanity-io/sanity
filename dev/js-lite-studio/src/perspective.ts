export type Perspective = {kind: 'drafts'} | {kind: 'published'} | {kind: 'release'; name: string}

export const DRAFTS: Perspective = {kind: 'drafts'}
export const PUBLISHED: Perspective = {kind: 'published'}

/** The `?perspective=` value of the JS studio: none for drafts, `published`, or a release name. */
export function perspectiveParam(perspective: Perspective): string | undefined {
  switch (perspective.kind) {
    case 'drafts':
      return undefined
    case 'published':
      return 'published'
    case 'release':
      return perspective.name
    default: {
      const exhaustive: never = perspective
      return exhaustive
    }
  }
}

export function parsePerspective(param: string | null | undefined): Perspective {
  if (!param || param === 'drafts') return DRAFTS
  if (param === 'published') return PUBLISHED
  return {kind: 'release', name: param}
}

/** The perspective queries read documents in: a release stacks on the drafts. */
export function queryPerspective(perspective: Perspective): string[] | 'drafts' | 'published' {
  switch (perspective.kind) {
    case 'drafts':
      return 'drafts'
    case 'published':
      return 'published'
    case 'release':
      return [perspective.name, 'drafts']
    default: {
      const exhaustive: never = perspective
      return exhaustive
    }
  }
}

export function releaseName(perspective: Perspective): string | undefined {
  return perspective.kind === 'release' ? perspective.name : undefined
}

export function samePerspective(a: Perspective, b: Perspective): boolean {
  return perspectiveParam(a) === perspectiveParam(b)
}
