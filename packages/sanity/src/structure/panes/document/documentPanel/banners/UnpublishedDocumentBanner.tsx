import {UnpublishIcon} from '@sanity/icons'
import {Stack, Text} from '@sanity/ui'
import {
  getVersionInlineBadge,
  isGoingToUnpublish,
  isReleaseDocument,
  Translate,
  truncateReleaseTitle,
  usePerspective,
  useTranslation,
} from 'sanity'

import {structureLocaleNamespace} from '../../../../i18n'
import {useDocumentPane} from '../../useDocumentPane'
import {Banner} from './Banner'

export function UnpublishedDocumentBanner() {
  const {value, editState} = useDocumentPane()
  const {selectedPerspective} = usePerspective()
  const isCurrentVersionGoingToUnpublish =
    isGoingToUnpublish(value) || (editState?.version && isGoingToUnpublish(editState?.version))

  const {t} = useTranslation(structureLocaleNamespace)
  const {t: tCore} = useTranslation()

  if (isReleaseDocument(selectedPerspective) && isCurrentVersionGoingToUnpublish) {
    const title =
      truncateReleaseTitle(selectedPerspective.metadata?.title) ||
      tCore('release.placeholder-untitled-release')

    return (
      <Banner
        tone="critical"
        content={
          <Stack space={2}>
            <Text size={1}>
              <Translate
                t={t}
                i18nKey="banners.unpublished-release-banner.text"
                values={{
                  title,
                }}
                components={{
                  VersionBadge: getVersionInlineBadge(selectedPerspective),
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
