import {type ReleaseDocument} from '@sanity/client'
import {type DocumentSystem} from '@sanity/types'
import {
  type PerspectiveContextValue,
  type SystemVariant,
  type VersionInfoDocumentStub,
} from 'sanity'

const PUBLISHED_ID = 'debug-article'
const VARIANT_ID = '_.variants.returningVisitor'
const AGENT_BUNDLE_ID = 'agent-cLDbG1nT'

const groupRef = {_ref: PUBLISHED_ID, _weak: true} as const
const variantRef = {_ref: VARIANT_ID, _weak: true} as const

const variant: SystemVariant = {
  _id: VARIANT_ID,
  _type: 'system.variant',
  _createdAt: '2026-01-01T08:00:00Z',
  _updatedAt: '2026-01-01T08:00:00Z',
  _rev: 'variantRev',
  conditions: {audience: 'returning-visitor'},
  priority: 1,
  metadata: {title: 'Returning visitor'},
}

function release(
  name: string,
  metadata: ReleaseDocument['metadata'],
  state: ReleaseDocument['state'] = 'active',
): ReleaseDocument {
  return {
    _id: `_.releases.${name}`,
    _type: 'system.release',
    _createdAt: '2026-01-01T08:00:00Z',
    _updatedAt: '2026-01-01T08:00:00Z',
    _rev: `${name}Rev`,
    name,
    state,
    metadata,
  }
}

const asapRelease = release('rAsap', {title: 'Hotfix', releaseType: 'asap', cardinality: 'many'})
const scheduledRelease = release('rScheduled', {
  title: 'Spring campaign',
  releaseType: 'scheduled',
  intendedPublishAt: '2026-03-01T08:00:00Z',
  cardinality: 'many',
})
const undecidedRelease = release('rUndecided', {
  title: 'Someday',
  releaseType: 'undecided',
  cardinality: 'many',
})
// Cardinality one + scheduled + an intended publish time makes this a "scheduled draft", which
// renders the clock icon in caution tone rather than the scheduled tone.
const scheduledDraftRelease = release('rScheduledDraft', {
  title: 'Scheduled draft',
  releaseType: 'scheduled',
  intendedPublishAt: '2026-03-01T08:00:00Z',
  cardinality: 'one',
})

function stub(id: string, system: Omit<DocumentSystem, 'group'>): VersionInfoDocumentStub {
  return {
    _id: id,
    _rev: 'stubRev',
    _createdAt: '2026-01-01T08:00:00Z',
    _updatedAt: '2026-01-01T08:00:00Z',
    _system: {group: groupRef, ...system},
  }
}

const published = stub(PUBLISHED_ID, {})
const draft = stub(`drafts.${PUBLISHED_ID}`, {bundleId: 'drafts'})
const publishedVariant = stub(`variant.published.${PUBLISHED_ID}`, {variant: variantRef})
const draftVariant = stub(`variant.drafts.${PUBLISHED_ID}`, {
  bundleId: 'drafts',
  variant: variantRef,
})

function inBundle(bundleId: string): VersionInfoDocumentStub {
  return stub(`versions.${bundleId}.${PUBLISHED_ID}`, {bundleId})
}

function inBundleVariant(bundleId: string): VersionInfoDocumentStub {
  return stub(`versions.${bundleId}.variant.${PUBLISHED_ID}`, {bundleId, variant: variantRef})
}

/** One row of the matrix: a set of versions that exist, plus what the indicator should show. */
export interface DebugRow {
  /** What exists for this document. Rendered as the preview title. */
  title: string
  /** What the indicator is expected to render. Rendered as the preview subtitle. */
  expected: string
  versions: VersionInfoDocumentStub[]
}

/** One section of the matrix: a perspective, and every document state worth showing under it. */
export interface DebugScenario {
  id: string
  /** What is selected in the perspective bar. */
  title: string
  description: string
  perspective: PerspectiveContextValue
  rows: DebugRow[]
}

const basePerspective: PerspectiveContextValue = {
  selectedPerspectiveName: undefined,
  selectedReleaseId: undefined,
  selectedPerspective: 'drafts',
  perspectiveStack: ['drafts'],
  excludedPerspectives: [],
  selectedVariantName: undefined,
  selectedVariant: undefined,
  bundle: 'drafts',
}

const publishedPerspective: PerspectiveContextValue = {
  ...basePerspective,
  selectedPerspectiveName: 'published',
  selectedPerspective: 'published',
  perspectiveStack: ['published'],
  bundle: 'published',
}

function withVariant(perspective: PerspectiveContextValue): PerspectiveContextValue {
  return {...perspective, selectedVariant: variant, selectedVariantName: 'returningVisitor'}
}

function releasePerspective(doc: ReleaseDocument): PerspectiveContextValue {
  return {
    ...basePerspective,
    selectedPerspectiveName: doc.name,
    selectedReleaseId: doc.name,
    selectedPerspective: doc,
    perspectiveStack: [doc.name, 'drafts'],
    bundle: doc.name,
  }
}

const agentPerspective: PerspectiveContextValue = {
  ...basePerspective,
  selectedPerspectiveName: AGENT_BUNDLE_ID,
  selectedPerspective: AGENT_BUNDLE_ID,
  perspectiveStack: [AGENT_BUNDLE_ID, 'drafts'],
  bundle: AGENT_BUNDLE_ID,
}

const systemRows: DebugRow[] = [
  {title: 'Draft only, never published', expected: 'Nothing', versions: [draft]},
  {title: 'Published, no edits', expected: 'Published disc', versions: [published]},
  {
    title: 'Published with draft edits',
    expected: 'Draft ring, published disc',
    versions: [draft, published],
  },
  {
    title: 'Only exists in a variant',
    expected: 'Nothing (variants are ignored unless one is selected)',
    versions: [draftVariant, publishedVariant],
  },
]

const systemVariantRows: DebugRow[] = [
  {
    title: 'Variant draft only, never published',
    expected: 'Rhombus, draft ring',
    versions: [draftVariant],
  },
  {
    title: 'Variant published, no edits',
    expected: 'Rhombus, published disc',
    versions: [publishedVariant],
  },
  {
    title: 'Variant published with draft edits',
    expected: 'Rhombus, draft ring, published disc',
    versions: [draftVariant, publishedVariant],
  },
  {
    title: 'Variant draft, default also published',
    expected: 'Rhombus, draft ring (the variant wins)',
    versions: [draft, published, draftVariant],
  },
  {
    title: 'Not in the variant, default published with edits',
    expected: 'Draft ring, published disc (falls back to the default)',
    versions: [draft, published],
  },
]

function bundleRows(bundleId: string, label: string): DebugRow[] {
  return [
    {title: `In ${label}`, expected: `${label} icon`, versions: [inBundle(bundleId)]},
    {
      title: `In ${label}, also published with edits`,
      expected: `${label} icon only`,
      versions: [draft, published, inBundle(bundleId)],
    },
    {
      title: `Not in ${label}, published with edits`,
      expected: 'Nothing',
      versions: [draft, published],
    },
    {
      title: `Only a variant of ${label}`,
      expected: 'Nothing (variants are ignored unless one is selected)',
      versions: [inBundleVariant(bundleId)],
    },
  ]
}

function bundleVariantRows(bundleId: string, label: string): DebugRow[] {
  return [
    {
      title: `In ${label} and in the variant`,
      expected: `Rhombus, ${label} icon`,
      versions: [inBundle(bundleId), inBundleVariant(bundleId)],
    },
    {
      title: 'In the variant only',
      expected: 'Rhombus',
      versions: [inBundleVariant(bundleId)],
    },
    {
      title: `In ${label} only`,
      expected: `${label} icon`,
      versions: [inBundle(bundleId)],
    },
    {
      title: `In neither, published with edits`,
      expected: 'Nothing',
      versions: [draft, published],
    },
  ]
}

export const scenarios: DebugScenario[] = [
  {
    id: 'drafts',
    title: 'Drafts perspective, no variant',
    description: 'The default studio view. Only the draft and published documents are described.',
    perspective: basePerspective,
    rows: systemRows,
  },
  {
    id: 'published',
    title: 'Published perspective, no variant',
    description: 'Behaves identically to the drafts perspective: both are system bundles.',
    perspective: publishedPerspective,
    rows: systemRows,
  },
  {
    id: 'drafts-variant',
    title: 'Drafts perspective, variant selected',
    description:
      'The variant takes over the indicator when the document exists in it, otherwise the default documents are described. Draft-only variants keep the draft ring.',
    perspective: withVariant(basePerspective),
    rows: systemVariantRows,
  },
  {
    id: 'published-variant',
    title: 'Published perspective, variant selected',
    description: 'Same as above: the perspective is still a system bundle.',
    perspective: withVariant(publishedPerspective),
    rows: systemVariantRows,
  },
  {
    id: 'asap',
    title: 'ASAP release, no variant',
    description: 'Only membership of the release matters. The bolt is in caution tone.',
    perspective: releasePerspective(asapRelease),
    rows: bundleRows(asapRelease.name, 'the ASAP release'),
  },
  {
    id: 'scheduled',
    title: 'Scheduled release, no variant',
    description: 'The clock is in primary tone.',
    perspective: releasePerspective(scheduledRelease),
    rows: bundleRows(scheduledRelease.name, 'the scheduled release'),
  },
  {
    id: 'undecided',
    title: 'Undecided release, no variant',
    description: 'Releases without a release type get the dot, in explore tone.',
    perspective: releasePerspective(undecidedRelease),
    rows: bundleRows(undecidedRelease.name, 'the undecided release'),
  },
  {
    id: 'scheduled-draft',
    title: 'Scheduled draft, no variant',
    description:
      'A cardinality-one scheduled release with an intended publish time. Gets the clock in caution tone rather than the scheduled tone.',
    perspective: releasePerspective(scheduledDraftRelease),
    rows: bundleRows(scheduledDraftRelease.name, 'the scheduled draft'),
  },
  {
    id: 'agent',
    title: 'Agent bundle, no variant',
    description: 'Anonymous bundles have no release document, so they get a suggest-toned dot.',
    perspective: agentPerspective,
    rows: bundleRows(AGENT_BUNDLE_ID, 'the agent bundle'),
  },
  {
    id: 'asap-variant',
    title: 'ASAP release, variant selected',
    description:
      'Membership of the release and of the variant within it are described independently. No status dots here: release versions have no publish state of their own.',
    perspective: withVariant(releasePerspective(asapRelease)),
    rows: bundleVariantRows(asapRelease.name, 'the ASAP release'),
  },
]
