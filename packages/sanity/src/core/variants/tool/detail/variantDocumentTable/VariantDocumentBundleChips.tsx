import {type ReleaseDocument} from '@sanity/client'
import {Badge, Box, Flex} from '@sanity/ui'
import {IntentLink} from 'sanity/router'

import {useTranslation} from '../../../../i18n'
import {ReleaseTitle} from '../../../../releases/components/ReleaseTitle'
import {RELEASES_INTENT} from '../../../../releases/plugin'
import {getReleaseDocumentIdFromReleaseId} from '../../../../releases/util/getReleaseDocumentIdFromReleaseId'
import {getReleaseIdFromReleaseDocumentId} from '../../../../releases/util/getReleaseIdFromReleaseDocumentId'
import {isPublishedBundleId, isReleaseBundle} from '../../util'
import {type VariantDocumentVersion} from '../types'

function getReleaseDocumentForVersion(
  version: VariantDocumentVersion,
  releasesById: Map<string, ReleaseDocument>,
): ReleaseDocument | undefined {
  if (version.releaseRef) {
    return releasesById.get(version.releaseRef)
  }

  if (isReleaseBundle(version.bundleId)) {
    const releaseDocumentId = getReleaseDocumentIdFromReleaseId(version.bundleId!)

    return releasesById.get(releaseDocumentId)
  }

  return undefined
}

function ReleaseBundleChip({release}: {release: ReleaseDocument}) {
  const {t} = useTranslation()
  const releaseId = getReleaseIdFromReleaseDocumentId(release._id)

  return (
    <ReleaseTitle
      title={release.metadata?.title}
      fallback={t('release.placeholder-untitled-release')}
    >
      {({displayTitle}) => (
        <IntentLink intent={RELEASES_INTENT} params={{id: releaseId}}>
          <Badge radius={2} tone="primary">
            {displayTitle}
          </Badge>
        </IntentLink>
      )}
    </ReleaseTitle>
  )
}

function StaticBundleChip({label, tone}: {label: string; tone: 'positive' | 'default'}) {
  return (
    <Badge radius={2} tone={tone}>
      {label}
    </Badge>
  )
}

export function VariantDocumentBundleChips({
  versions,
  releasesById,
}: {
  versions: VariantDocumentVersion[]
  releasesById: Map<string, ReleaseDocument>
}): React.JSX.Element {
  const {t} = useTranslation()

  return (
    <Box style={{minWidth: 0, width: '100%', overflowX: 'auto', overflowY: 'hidden'}}>
      <Flex align="center" gap={1} wrap="nowrap" style={{width: 'max-content'}}>
        {versions.map((version) => {
          if (isPublishedBundleId(version.bundleId)) {
            return (
              <StaticBundleChip
                key={version.documentId}
                label={t('release.chip.published')}
                tone="positive"
              />
            )
          }

          if (version.bundleId === 'drafts') {
            return (
              <StaticBundleChip
                key={version.documentId}
                label={t('release.chip.draft')}
                tone="default"
              />
            )
          }

          const release = getReleaseDocumentForVersion(version, releasesById)

          if (release) {
            return <ReleaseBundleChip key={version.documentId} release={release} />
          }

          return (
            <StaticBundleChip
              key={version.documentId}
              label={t('release.placeholder-untitled-release')}
              tone="default"
            />
          )
        })}
      </Flex>
    </Box>
  )
}
