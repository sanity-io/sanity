import {SanityEncoder} from '@sanity/mutate'
import {applyInIndex} from '@sanity/mutate/_unstable_apply'
import {getAtPath, isArrayElement, parse, type Path, type PathElement} from '@sanity/mutate/path'

import {ContentLakeError, mutationFailed} from './contentLakeError'
import {
  type ContentLakeDocument,
  type DocumentIndex,
  type MutationPayload,
  type PatchPayload,
} from './types'

// `@sanity/mutate` 0.18.2's decoder treats `dec` as `inc`, so a raw `inc` crashes and a raw `dec` is dropped.
function normalizeIncDec(mutation: MutationPayload): MutationPayload {
  if (mutation.patch === undefined) return mutation
  const {inc, dec, ...rest} = mutation.patch
  if (inc === undefined && dec === undefined) return mutation
  const negatedDec = Object.fromEntries(
    Object.entries((dec ?? {}) as Record<string, number>).map(([path, amount]) => [path, -amount]),
  )
  return {patch: {...rest, inc: {...(inc as Record<string, number>), ...negatedDec}, dec: {}}}
}

function stripTransactionFields(mutation: MutationPayload): MutationPayload {
  if (mutation.patch === undefined) return mutation
  const {ifRevisionID: _ifRevisionID, unsetIsEmpty: _unsetIsEmpty, ...patch} = mutation.patch
  return {patch}
}

const DOTTED_PATH = /^[A-Za-z_]\w*(\.[A-Za-z_]\w*)+$/

function parentPathsOf(path: string): string[] {
  const segments = path.split('.')
  return segments.slice(1).map((_segment, depth) => segments.slice(0, depth + 1).join('.'))
}

// Content Lake creates missing parent objects for a dotted `set`/`setIfMissing` path; `@sanity/mutate` skips the write.
function withMissingParents(mutation: MutationPayload): MutationPayload[] {
  const patch = mutation.patch
  if (patch === undefined) return [mutation]
  const parents = new Set(
    [patch.set, patch.setIfMissing]
      .flatMap((values) => Object.keys((values ?? {}) as Record<string, unknown>))
      .filter((path) => DOTTED_PATH.test(path))
      .flatMap(parentPathsOf),
  )
  return [
    ...[...parents].map((parent) => ({patch: {id: patch.id, setIfMissing: {[parent]: {}}}})),
    mutation,
  ]
}

function jsonPathOf(path: Path): string {
  const segments = path.map((element) => {
    if (typeof element === 'string') return `['${element}']`
    if (typeof element === 'number') return `[${element}]`
    if (Array.isArray(element)) return `[${element.join(':')}]`
    return `[?(@._key=='${element._key}')]`
  })
  return `$${segments.join('')}`
}

function childAt(value: unknown, element: PathElement): unknown {
  return value === undefined || value === null
    ? undefined
    : (getAtPath([element], value) as unknown)
}

function valueAt(path: Path, document: ContentLakeDocument | undefined): unknown {
  const elements: PathElement[] = [...path]
  return elements.reduce<unknown>(childAt, document)
}

// Content Lake answers 200 and changes nothing when a path names an array item that is not there.
function matchesNoArrayItem(path: Path, document: ContentLakeDocument | undefined): boolean {
  return path.some((element, depth) => {
    const parent = isArrayElement(element) ? valueAt(path.slice(0, depth), document) : undefined
    return Array.isArray(parent) && getAtPath([element], parent) === undefined
  })
}

function diffMatchPatchPaths(patch: PatchPayload): string[] {
  return Object.keys((patch.diffMatchPatch ?? {}) as Record<string, unknown>)
}

function assertDiffMatchPatchable(
  document: ContentLakeDocument | undefined,
  patch: PatchPayload,
): void {
  diffMatchPatchPaths(patch).forEach((key) => {
    const path = parse(key)
    if (typeof valueAt(path, document) === 'string') return
    throw new ContentLakeError(400, {
      description: `Can't diff-match-patch "${jsonPathOf(path)}", because it is not a string`,
      type: 'validationError',
    })
  })
}

function withoutMissingItemDiffs(
  document: ContentLakeDocument | undefined,
  mutation: MutationPayload,
): MutationPayload {
  const patch = mutation.patch
  if (patch?.diffMatchPatch === undefined) return mutation
  const diffMatchPatch = Object.fromEntries(
    Object.entries(patch.diffMatchPatch as Record<string, unknown>).flatMap((entry) =>
      matchesNoArrayItem(parse(entry[0]), document) ? [] : [entry],
    ),
  )
  return {patch: {...patch, diffMatchPatch}}
}

function applyMutation(index: DocumentIndex, mutation: MutationPayload): DocumentIndex {
  const target = mutation.patch ? index[mutation.patch.id] : undefined
  const applicable = withoutMissingItemDiffs(target, mutation)
  if (applicable.patch) assertDiffMatchPatchable(target, applicable.patch)
  const decoded = SanityEncoder.decodeAll(
    withMissingParents(applicable).map(stripTransactionFields).map(normalizeIncDec) as never[],
  )
  return applyInIndex(index as never, decoded as never) as DocumentIndex
}

function failedMutation(position: number, error: unknown): ContentLakeError {
  const failure =
    error instanceof ContentLakeError
      ? error.body
      : {
          description: error instanceof Error ? error.message : String(error),
          type: 'validationError',
        }
  return mutationFailed(400, position, failure)
}

// Uses `@sanity/mutate` so the result never comes from the `@sanity/mutator` engine the studio runs.
export function applyMutations(index: DocumentIndex, mutations: MutationPayload[]): DocumentIndex {
  return mutations.reduce((current, mutation, position) => {
    try {
      return applyMutation(current, mutation)
    } catch (error) {
      throw failedMutation(position, error)
    }
  }, index)
}
