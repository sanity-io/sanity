import {WarningOutlineIcon} from '@sanity/icons'
import {Text} from '@sanity/ui'
import {useTranslation} from 'sanity'

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
      content={<Text size={1}>{t('banners.revision-not-found.description')}</Text>}
    />
  )
}
