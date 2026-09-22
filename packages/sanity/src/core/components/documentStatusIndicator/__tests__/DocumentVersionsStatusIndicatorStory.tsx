import {type ReleaseDocument} from '@sanity/client'
import {DocumentIcon} from '@sanity/icons/Document'
import {type DocumentSystem} from '@sanity/types'
import {Card, Text} from '@sanity/ui'
import {PerspectiveContext} from 'sanity/_singletons'
import {VStack} from 'ui5'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {DefaultPreview} from '../../../components/previews/general/DefaultPreview'
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

interface StatusDocument {
  title: string
  subtitle: string
  documentVersions: VersionInfoDocumentStub[]
}

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

const published = versionStub(PUBLISHED_ID, {})
const draft = versionStub(`drafts.${PUBLISHED_ID}`, {bundleId: 'drafts'})
const publishedVariant = versionStub(`published.alpha.${PUBLISHED_ID}`, {variants: [variantRef]})
const draftVariant = versionStub(`drafts.alpha.${PUBLISHED_ID}`, {
  bundleId: 'drafts',
  variants: [variantRef],
})

const DRAFTS: PerspectiveContextValue = {
  selectedPerspectiveName: undefined,
  selectedReleaseId: undefined,
  selectedPerspective: 'drafts',
  perspectiveStack: ['drafts'],
  excludedPerspectives: [],
  selectedVariantName: undefined,
  selectedVariant: undefined,
  bundle: 'drafts',
}

const DRAFTS_VARIANT: PerspectiveContextValue = {
  ...DRAFTS,
  selectedVariantName: 'alpha-audience',
  selectedVariant: variantAlphaAudience,
}

function releasePerspective(
  release: ReleaseDocument,
  variantSelected: boolean,
): PerspectiveContextValue {
  const releaseId = getReleaseIdFromReleaseDocumentId(release._id)

  return {
    selectedPerspectiveName: releaseId,
    selectedReleaseId: releaseId,
    selectedPerspective: release,
    perspectiveStack: [releaseId, 'drafts'],
    excludedPerspectives: [],
    selectedVariantName: variantSelected ? 'alpha-audience' : undefined,
    selectedVariant: variantSelected ? variantAlphaAudience : undefined,
    bundle: releaseId,
  }
}

function releaseVersions(release: ReleaseDocument) {
  const releaseId = getReleaseIdFromReleaseDocumentId(release._id)
  const releaseDefault = versionStub(`versions.${releaseId}.${PUBLISHED_ID}`, {bundleId: releaseId})
  const releaseVariant = versionStub(`versions.${releaseId}.alpha.${PUBLISHED_ID}`, {
    bundleId: releaseId,
    variants: [variantRef],
  })

  return {releaseDefault, releaseVariant}
}

const asap = releaseVersions(activeASAPRelease)
const scheduled = releaseVersions(activeScheduledRelease)
const undecided = releaseVersions(activeUndecidedRelease)

const ASAP = releasePerspective(activeASAPRelease, false)
const ASAP_VARIANT = releasePerspective(activeASAPRelease, true)
const SCHEDULED = releasePerspective(activeScheduledRelease, false)
const SCHEDULED_VARIANT = releasePerspective(activeScheduledRelease, true)
const UNDECIDED = releasePerspective(activeUndecidedRelease, false)
const UNDECIDED_VARIANT = releasePerspective(activeUndecidedRelease, true)

const DRAFT_DOCUMENTS: StatusDocument[] = [
  {title: 'Draft only', subtitle: 'Never published', documentVersions: [draft]},
  {title: 'Published only', subtitle: 'No unpublished edits', documentVersions: [published]},
  {
    title: 'Published and draft',
    subtitle: 'Unpublished edits',
    documentVersions: [published, draft],
  },
  {
    title: 'Variant only',
    subtitle: 'Ignored until that variant is selected',
    documentVersions: [draftVariant],
  },
]

const DRAFT_VARIANT_DOCUMENTS: StatusDocument[] = [
  {
    title: 'Draft only',
    subtitle: 'This variant was never published',
    documentVersions: [draftVariant],
  },
  {
    title: 'Published only',
    subtitle: 'This variant has no unpublished edits',
    documentVersions: [publishedVariant],
  },
  {
    title: 'Published and draft',
    subtitle: 'Unpublished edits on this variant',
    documentVersions: [publishedVariant, draftVariant],
  },
  {
    title: 'Not in this variant',
    subtitle: 'Falls back to the default document',
    documentVersions: [published, draft],
  },
]

function releaseDocuments(
  versions: ReturnType<typeof releaseVersions>,
  variantSelected: boolean,
  showHiddenDots: boolean,
): StatusDocument[] {
  if (!variantSelected) {
    return [
      {title: 'In this release', subtitle: 'Article', documentVersions: [versions.releaseDefault]},
      ...(showHiddenDots
        ? [
            {
              title: 'In this release, with edits',
              subtitle: 'Published and draft dots stay hidden',
              documentVersions: [published, draft, versions.releaseDefault],
            },
            {
              title: 'Variant only',
              subtitle: 'Ignored until that variant is selected',
              documentVersions: [versions.releaseVariant],
            },
          ]
        : []),
      {
        title: 'Not in this release',
        subtitle: 'Article',
        documentVersions: [published, draft],
      },
    ]
  }

  return [
    {
      title: 'Variant in this release',
      subtitle: 'Article',
      documentVersions: [versions.releaseVariant],
    },
    {
      title: 'In this release, not this variant',
      subtitle: 'The default version is in the release',
      documentVersions: [versions.releaseDefault],
    },
    ...(showHiddenDots
      ? [
          {
            title: 'Not in this release',
            subtitle: 'Article',
            documentVersions: [published, draft],
          },
        ]
      : []),
  ]
}

function DocumentList({
  heading,
  perspective,
  documents,
}: {
  heading: string
  perspective: PerspectiveContextValue
  documents: StatusDocument[]
}) {
  return (
    <PerspectiveContext.Provider value={perspective}>
      <VStack gap={1}>
        <Text muted size={1} weight="medium">
          {heading}
        </Text>
        {documents.map((document) => (
          <DefaultPreview
            key={document.title}
            media={<DocumentIcon />}
            status={
              <DocumentVersionsStatusIndicator documentVersions={document.documentVersions} />
            }
            subtitle={document.subtitle}
            title={document.title}
          />
        ))}
      </VStack>
    </PerspectiveContext.Provider>
  )
}

/**
 * Chromatic sentinel for the icons on structure list rows. Each group is one
 * studio perspective: drafts, drafts with a variant selected, then each release
 * type with and without that variant. Icons sit in the preview status slot,
 * which is where the studio renders them.
 */
export function DocumentVersionsStatusIndicatorStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 420}}>
        <VStack gap={5}>
          <DocumentList documents={DRAFT_DOCUMENTS} heading="Drafts" perspective={DRAFTS} />
          <DocumentList
            documents={DRAFT_VARIANT_DOCUMENTS}
            heading="Drafts · Alpha audience"
            perspective={DRAFTS_VARIANT}
          />
          <DocumentList
            documents={releaseDocuments(asap, false, true)}
            heading="ASAP"
            perspective={ASAP}
          />
          <DocumentList
            documents={releaseDocuments(asap, true, true)}
            heading="ASAP · Alpha audience"
            perspective={ASAP_VARIANT}
          />
          <DocumentList
            documents={releaseDocuments(scheduled, false, false)}
            heading="Scheduled"
            perspective={SCHEDULED}
          />
          <DocumentList
            documents={releaseDocuments(scheduled, true, false)}
            heading="Scheduled · Alpha audience"
            perspective={SCHEDULED_VARIANT}
          />
          <DocumentList
            documents={releaseDocuments(undecided, false, false)}
            heading="Undecided"
            perspective={UNDECIDED}
          />
          <DocumentList
            documents={releaseDocuments(undecided, true, false)}
            heading="Undecided · Alpha audience"
            perspective={UNDECIDED_VARIANT}
          />
        </VStack>
      </Card>
    </TestWrapper>
  )
}
