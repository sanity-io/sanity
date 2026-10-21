import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {useTranslation} from 'sanity'
import {Text} from 'ui5'

import {structureLocaleNamespace} from '../../../../i18n'
import {useDocumentPane} from '../../useDocumentPane'
import {Banner} from './Banner'

export function RevisionNotFoundBanner() {
  const {revisionNotFound} = useDocumentPane()
  const {t} = useTranslation(structureLocaleNamespace)

  if (!revisionNotFound) return null

  return (
    <Banner
      tone="caution"
      data-test-id="revision-not-found-banner"
      icon={WarningOutlineIcon}
      content={
        <Text size={1} as="div" trim={true} tone="caution">
          {t('banners.revision-not-found.description')}
        </Text>
      }
    />
  )
}
