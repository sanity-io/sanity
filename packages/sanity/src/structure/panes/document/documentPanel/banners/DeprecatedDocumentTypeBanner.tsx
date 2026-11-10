import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {isDeprecatedSchemaType, Translate, useTranslation} from 'sanity'
import {Text} from 'ui5'

import {structureLocaleNamespace} from '../../../../i18n'
import {useDocumentPaneInfo} from '../../useDocumentPaneInfo'
import {Banner} from './Banner'

export function DeprecatedDocumentTypeBanner() {
  const {schemaType} = useDocumentPaneInfo()
  const {t} = useTranslation(structureLocaleNamespace)

  if (!isDeprecatedSchemaType(schemaType)) {
    return null
  }

  return (
    <Banner
      content={
        <Text size={1} weight="medium" as="div" trim={true}>
          <Translate t={t} i18nKey="banners.deprecated-document-type-banner.text" />{' '}
          {schemaType.deprecated.reason}
        </Text>
      }
      data-testid="deprecated-document-type-banner"
      icon={ErrorOutlineIcon}
    />
  )
}
