import {type ReleaseDocument} from '@sanity/client'
import {UnpublishIcon} from '@sanity/icons/Unpublish'
import {Stack, Text} from '@sanity/ui'
import {
  getReleaseTone,
  isGoingToUnpublish,
  isReleaseDocument,
  ReleaseTitle,
  Translate,
  usePerspective,
  useTranslation,
  VersionInlineBadge,
} from 'sanity'

import {structureLocaleNamespace} from '../../../../i18n'
import {useDocumentPane} from '../../useDocumentPane'
import {Banner} from './Banner'

function VersionBadge({
  children,
  fallbackTitle,
  release,
}: {
  children?: React.ReactNode
  fallbackTitle?: string
  release?: ReleaseDocument
}) {
  if (!release) return null
  return (
    <ReleaseTitle title={release.metadata?.title} fallback={fallbackTitle ?? ''}>
      {() => <VersionInlineBadge $tone={getReleaseTone(release)}>{children}</VersionInlineBadge>}
    </ReleaseTitle>
  )
}

export function UnpublishedDocumentBanner() {
  const {value, editState} = useDocumentPane()
  const {selectedPerspective} = usePerspective()
  const isCurrentVersionGoingToUnpublish =
    isGoingToUnpublish(value) || (editState?.version && isGoingToUnpublish(editState?.version))

  const {t} = useTranslation(structureLocaleNamespace)
  const {t: tCore} = useTranslation()

  if (isReleaseDocument(selectedPerspective) && isCurrentVersionGoingToUnpublish) {
    const releaseTitle =
      selectedPerspective.metadata?.title || tCore('release.placeholder-untitled-release')

    return (
      <Banner
        tone="critical"
        content={
          <Stack gap={2}>
            <Text size={1}>
              <Translate
                t={t}
                i18nKey="banners.unpublished-release-banner.text"
                values={{
                  title: releaseTitle,
                }}
                components={{VersionBadge}}
                componentProps={{
                  fallbackTitle: tCore('release.placeholder-untitled-release'),
                  release: selectedPerspective,
                }}
              />
            </Text>
            <Text size={1}>
              <Translate t={t} i18nKey="banners.unpublished-release-banner.text-with-published" />
            </Text>
          </Stack>
        }
        icon={UnpublishIcon}
      />
    )
  }
  return null
}
