import {type ReleaseDocument} from '@sanity/client'
import {type DocumentSystem} from '@sanity/types'
import {Card, Text} from '@sanity/ui'
import {type ReactNode} from 'react'
import {PerspectiveContext} from 'sanity/_singletons'
import {Flex, VStack} from 'ui5'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {type PerspectiveContextValue} from '../../../perspective/types'
import {
  activeASAPRelease,
  activeScheduledRelease,
  activeUndecidedRelease,
} from '../../../releases/__fixtures__/release.fixture'
import {type VersionInfoDocumentStub} from '../../../releases/store/types'
import {getReleaseIdFromReleaseDocumentId} from '../../../releases/util/getReleaseIdFromReleaseDocumentId'
import {variantAlphaAudience} from '../../../variants/__fixtures__/variants.fixture'
import {DocumentVersionsStatusIndicator} from '../DocumentVersionsStatusIndicator'

const PUBLISHED_ID = 'article-1'
const groupRef = {_ref: PUBLISHED_ID, _weak: true} as const
const variantRef = {_ref: variantAlphaAudience._id, _key: 'k-123'} as const

type VariantSelection = 'none' | 'selected' | 'resolving'

type Membership =
  | 'inRelease'
  | 'inReleaseWithPublishedDraft'
  | 'notInRelease'
  | 'variantInRelease'
  | 'variantAndDefaultInRelease'
  | 'defaultOnlyVariantSelected'
  | 'variantSelectedNotInRelease'
  | 'variantVersionIgnored'
  | 'variantResolving'

const RELEASES: {label: string; release: ReleaseDocument}[] = [
  {label: 'ASAP', release: activeASAPRelease},
  {label: 'Scheduled', release: activeScheduledRelease},
  {label: 'Undecided', release: activeUndecidedRelease},
]

const ROWS: {label: string; kind: Membership}[] = [
  {label: 'in release', kind: 'inRelease'},
  {label: 'in release, published with draft', kind: 'inReleaseWithPublishedDraft'},
  {label: 'not in release', kind: 'notInRelease'},
  {label: 'variant in release', kind: 'variantInRelease'},
  {label: 'variant and default in release', kind: 'variantAndDefaultInRelease'},
  {label: 'default only, variant selected', kind: 'defaultOnlyVariantSelected'},
  {label: 'variant selected, not in release', kind: 'variantSelectedNotInRelease'},
  {label: 'variant version, no variant selected', kind: 'variantVersionIgnored'},
  {label: 'variant still resolving', kind: 'variantResolving'},
]

const COLUMN = '88px'
const GRID_COLUMNS = `minmax(0, 1fr) ${COLUMN} ${COLUMN} ${COLUMN}`

function versionStub(id: string, system: Omit<DocumentSystem, 'group'>): VersionInfoDocumentStub {
  return {
    _id: id,
    _rev: '',
    _createdAt: '',
    _updatedAt: '',
    _type: 'article',
    _system: {group: groupRef, ...system},
  }
}

function releasePerspective(
  release: ReleaseDocument,
  variantSelection: VariantSelection,
): PerspectiveContextValue {
  const releaseId = getReleaseIdFromReleaseDocumentId(release._id)

  return {
    selectedPerspectiveName: releaseId,
    selectedReleaseId: releaseId,
    selectedPerspective: release,
    perspectiveStack: [releaseId, 'drafts'],
    excludedPerspectives: [],
    selectedVariantName: variantSelection === 'none' ? undefined : 'alpha-audience',
    selectedVariant: variantSelection === 'selected' ? variantAlphaAudience : undefined,
    bundle: releaseId,
  }
}

function versionsFor(releaseId: string, kind: Membership): VersionInfoDocumentStub[] {
  const published = versionStub(PUBLISHED_ID, {})
  const draft = versionStub('drafts.article-1', {bundleId: 'drafts'})
  const releaseDefault = versionStub(`versions.${releaseId}.${PUBLISHED_ID}`, {bundleId: releaseId})
  const releaseVariant = versionStub(`versions.${releaseId}.alpha.${PUBLISHED_ID}`, {
    bundleId: releaseId,
    variants: [variantRef],
  })

  switch (kind) {
    case 'inRelease':
      return [releaseDefault]
    case 'inReleaseWithPublishedDraft':
      return [published, draft, releaseDefault]
    case 'notInRelease':
      return [published, draft]
    case 'variantInRelease':
      return [releaseVariant]
    case 'variantAndDefaultInRelease':
      return [releaseDefault, releaseVariant]
    case 'defaultOnlyVariantSelected':
      return [published, draft, releaseDefault]
    case 'variantSelectedNotInRelease':
      return [published, draft]
    case 'variantVersionIgnored':
      return [releaseVariant]
    case 'variantResolving':
      return [releaseDefault, releaseVariant]
    default: {
      const exhaustive: never = kind
      return exhaustive
    }
  }
}

function variantSelectionFor(kind: Membership): VariantSelection {
  switch (kind) {
    case 'inRelease':
    case 'inReleaseWithPublishedDraft':
    case 'notInRelease':
    case 'variantVersionIgnored':
      return 'none'
    case 'variantInRelease':
    case 'variantAndDefaultInRelease':
    case 'defaultOnlyVariantSelected':
    case 'variantSelectedNotInRelease':
      return 'selected'
    case 'variantResolving':
      return 'resolving'
    default: {
      const exhaustive: never = kind
      return exhaustive
    }
  }
}

interface StatusCell {
  key: string
  perspective: PerspectiveContextValue
  documentVersions: VersionInfoDocumentStub[]
}

const CELLS: Record<Membership, StatusCell[]> = {
  inRelease: [],
  inReleaseWithPublishedDraft: [],
  notInRelease: [],
  variantInRelease: [],
  variantAndDefaultInRelease: [],
  defaultOnlyVariantSelected: [],
  variantSelectedNotInRelease: [],
  variantVersionIgnored: [],
  variantResolving: [],
}

for (const column of RELEASES) {
  const releaseId = getReleaseIdFromReleaseDocumentId(column.release._id)
  for (const row of ROWS) {
    CELLS[row.kind].push({
      key: column.label,
      perspective: releasePerspective(column.release, variantSelectionFor(row.kind)),
      documentVersions: versionsFor(releaseId, row.kind),
    })
  }
}

function IconCell({cell}: {cell: StatusCell}) {
  return (
    <PerspectiveContext.Provider value={cell.perspective}>
      <Flex alignItems="center" justifyContent="center" style={{minHeight: 20, width: COLUMN}}>
        <DocumentVersionsStatusIndicator documentVersions={cell.documentVersions} />
      </Flex>
    </PerspectiveContext.Provider>
  )
}

function GridRow({children}: {children: ReactNode}) {
  return (
    <div
      style={{
        alignItems: 'center',
        columnGap: 12,
        display: 'grid',
        gridTemplateColumns: GRID_COLUMNS,
      }}
    >
      {children}
    </div>
  )
}

/**
 * Chromatic sentinel for release-perspective list icons. Columns are the three
 * release types (ASAP caution bolt, scheduled suggest clock, undecided neutral
 * mark). Rows are every membership the indicator can resolve: in the release,
 * not in the release, variant in the release, and a variant that is still resolving.
 * Publish-state dots stay hidden whenever a release is selected.
 */
export function DocumentVersionsStatusIndicatorReleaseStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 640}}>
        <VStack gap={3}>
          <GridRow>
            <span />
            {RELEASES.map((column) => (
              <Text align="center" key={column.label} muted size={1} weight="medium">
                {column.label}
              </Text>
            ))}
          </GridRow>
          {ROWS.map((row) => (
            <GridRow key={row.kind}>
              <Text size={1}>{row.label}</Text>
              {CELLS[row.kind].map((cell) => (
                <IconCell cell={cell} key={cell.key} />
              ))}
            </GridRow>
          ))}
        </VStack>
      </Card>
    </TestWrapper>
  )
}
