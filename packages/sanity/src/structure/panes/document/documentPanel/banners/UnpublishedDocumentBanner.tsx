import {UnpublishIcon} from '@sanity/icons'
import {Text} from '@sanity/ui'
import {
  getVersionInlineBadge,
  isGoingToUnpublish,
  isReleaseDocument,
  Translate,
  usePerspective,
  useTranslation,
} from 'sanity'

import {structureLocaleNamespace} from '../../../../i18n'
import {useDocumentPane} from '../../useDocumentPane'
import {Banner} from './Banner'

export function UnpublishedDocumentBanner() {
  const {value} = useDocumentPane()
  const {selectedPerspective} = usePerspective()
  const willBeUnpublished = isGoingToUnpublish(value)

  const {t} = useTranslation(structureLocaleNamespace)
  const {t: tCore} = useTranslation()

  if (isReleaseDocument(selectedPerspective) && willBeUnpublished) {
    const title =
      selectedPerspective.metadata?.title || tCore('release.placeholder-untitled-release')

    return (
      <Banner
        tone="critical"
        content={
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
        }
        icon={UnpublishIcon}
      />
    )
  }
  return null
}
