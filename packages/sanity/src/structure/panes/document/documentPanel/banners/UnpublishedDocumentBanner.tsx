import {UnpublishIcon} from '@sanity/icons'
import {Text} from '@sanity/ui'
import {
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

  if (isReleaseDocument(selectedPerspective) && willBeUnpublished) {
    return (
      <Banner
        tone="critical"
        content={
          <Text size={1}>
            <Translate
              t={t}
              i18nKey="banners.unpublished-release-banner.text"
              values={{title: selectedPerspective.metadata?.title}}
            />
          </Text>
        }
        icon={UnpublishIcon}
      />
    )
  }
  return null
}
