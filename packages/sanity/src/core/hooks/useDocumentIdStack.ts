import {type ReleaseDocument} from '@sanity/client'
import {type SanityDocument, type StrictVersionLayeringOptions} from '@sanity/types'
import {useMemo} from 'react'

import {usePerspective} from '../perspective/usePerspective'
import {useDocumentVersions} from '../releases/hooks/useDocumentVersions'
import {type VersionInfoDocumentStub} from '../releases/store/types'
import {useActiveReleases} from '../releases/store/useActiveReleases'
import {getReleaseIdFromReleaseDocumentId} from '../releases/util/getReleaseIdFromReleaseDocumentId'
import {type EditStateFor} from '../store/document/document-pair/editState'
import {useWorkspace} from '../studio/workspace'
import {getVersionId, isDraftId} from '../util/draftUtils'
import {useFilteredReleases} from './useFilteredReleases'

interface Options extends StrictVersionLayeringOptions {
  displayed: Partial<SanityDocument> | null
  documentId: string
  editState: EditStateFor | null
}

/**
 * @internal
 */
export interface DocumentIdStack {
  /**
   * The position of the displayed document within the stack.
   */
  position: number
  /**
   * The id of the previous document in the stack.
   */
  previousId?: string
  /**
   * The id of the next document in the stack.
   */
  nextId?: string
  /**
   * An array of document ids comprising the stack the displayed document is a member of, ordered per
   * release layering.
   */
  stack: string[]
}

/**
 * Builds the id stack for a variant target from version stubs matched on `_system.variant`,
 * layered like the base stack: variant-of-published, variant-of-drafts, then variant release
 * versions in active-release order.
 *
 * Unlike the base stack, the ids cannot be derived from release ids (`getVersionId`): variant
 * version ids are `versions.<scopeId>.<groupId>` with an opaque server-generated scope hash, so
 * membership and ordering are discovered from the stubs' `_system` metadata instead.
 *
 * @internal
 */
export function buildVariantIdStack({
  displayedId,
  isDraftModelEnabled,
  releases,
  strict,
  variantId,
  versions,
}: {
  displayedId: string | undefined
  isDraftModelEnabled: boolean
  releases: ReleaseDocument[]
  strict?: boolean
  variantId: string
  versions: VersionInfoDocumentStub[]
}): string[] {
  const variantStubs = versions.filter((stub) => stub._system.variant?._ref === variantId)
  const publishedStub = variantStubs.find((stub) => !stub._system.bundleId)
  const draftStub = variantStubs.find((stub) => stub._system.bundleId === 'drafts')

  const releaseByBundle = new Map(
    releases.map((release) => [getReleaseIdFromReleaseDocumentId(release._id), release]),
  )
  const releaseOrder = new Map(
    releases.map((release, index) => [getReleaseIdFromReleaseDocumentId(release._id), index]),
  )

  const releaseStubs = variantStubs
    .filter(
      (stub) =>
        stub._system.bundleId &&
        stub._system.bundleId !== 'drafts' &&
        releaseByBundle.has(stub._system.bundleId),
    )
    .toSorted(
      (a, b) =>
        (releaseOrder.get(a._system.bundleId!) ?? 0) - (releaseOrder.get(b._system.bundleId!) ?? 0),
    )

  // Strict mode mirrors the base stack: only include release layers whose chronology relative to
  // the displayed version is known — the displayed version itself, or scheduled releases.
  const releaseLayer = strict
    ? releaseStubs.filter(
        (stub) =>
          stub._id === displayedId ||
          releaseByBundle.get(stub._system.bundleId!)?.metadata.releaseType === 'scheduled',
      )
    : releaseStubs

  // In strict mode, only include the variant draft if it's the displayed version (see
  // `shouldIncludeDraft` in the base stack below for the rationale).
  const shouldIncludeDraft = isDraftModelEnabled && (strict ? displayedId === draftStub?._id : true)

  return [
    publishedStub?._id,
    shouldIncludeDraft ? draftStub?._id : undefined,
    ...releaseLayer.map((stub) => stub._id),
  ].filter((id): id is string => typeof id === 'string')
}

/**
 * Get a stack of document ids representing existing versions of the provided document with release
 * layering applied.
 *
 * @internal
 */
export function useDocumentIdStack({
  displayed,
  documentId,
  editState,
  strict,
}: Options): DocumentIdStack {
  const {
    document: {
      drafts: {enabled: isDraftModelEnabled},
    },
  } = useWorkspace()

  const filteredReleases = useFilteredReleases({
    displayed,
    documentId,
    strict,
  })

  const {selectedVariant} = usePerspective()
  const {data: activeReleases} = useActiveReleases()
  const {versions: documentVersions} = useDocumentVersions({documentId})

  let stack: string[]

  if (selectedVariant) {
    // Variant targets: the stack is the variant's own documents. The base draft/published pair
    // and plain release versions belong to a different stack and never neighbor a variant.
    stack = buildVariantIdStack({
      displayedId: displayed?._id,
      isDraftModelEnabled,
      releases: activeReleases,
      strict,
      variantId: selectedVariant._id,
      versions: documentVersions,
    })

    // Mirror the base anonymous-version behavior: a checked-out version not present in the stack
    // (e.g. still-propagating stubs) is appended so the displayed document keeps a position.
    if (editState?.version !== null && displayed?._id && !stack.includes(displayed._id)) {
      stack = stack.concat(displayed._id)
    }
  } else {
    // In strict mode, only include the draft if it's the displayed version. This
    // ensures layering reflects only the known chronology of versions.
    //
    // For example, when viewing an ASAP version, it's impossible to know whether
    // the draft will be published first.
    const shouldIncludeDraft =
      isDraftModelEnabled && (strict ? isDraftId(displayed?._id ?? '') : true)

    const systemStack = [
      editState?.published?._id,
      shouldIncludeDraft ? editState?.draft?._id : [],
    ].flat()

    const releaseStack = filteredReleases.currentReleases.map(
      (release) =>
        editState?.id && getVersionId(editState.id, getReleaseIdFromReleaseDocumentId(release._id)),
    )

    // Infer the subject is an anonymous version if:
    //
    //   1. The subject has a version checked out.
    //   2. *And* there is no release containing the checked-out version.
    const isAnonymousVersion = editState?.version !== null && !releaseStack.includes(displayed?._id)
    const anonymousVersionsStack = isAnonymousVersion ? [displayed?._id] : []

    stack = systemStack
      .concat(!isAnonymousVersion || !strict ? releaseStack : [])
      .concat(anonymousVersionsStack)
      .filter((id) => typeof id === 'string')
  }

  const position = useMemo(
    () => stack.findIndex((id) => id === displayed?._id),
    [displayed?._id, stack],
  )

  const previousId = useMemo(() => stack[position - 1] ?? undefined, [position, stack])
  const nextId = useMemo(() => stack[position + 1] ?? undefined, [position, stack])

  return {
    position,
    previousId,
    nextId,
    stack,
  }
}
