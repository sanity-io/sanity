import {Text} from '@sanity/ui'
import {ErrorOutlineIcon} from '@sanity/icons'
import {useDocumentPane} from '../../useDocumentPane'
import {structureLocaleNamespace} from '../../../../i18n'
import {Banner} from './Banner'
import {Translate, isDeprecatedSchemaType, useTranslation} from 'sanity'

export function DeprecatedDocumentTypeBanner() {
  const {schemaType} = useDocumentPane()
  const {t} = useTranslation(structureLocaleNamespace)

  if (!isDeprecatedSchemaType(schemaType)) {
    return null
  }

  return (
    <Banner
      content={
        <Text size={1} weight="medium">
          <Translate t={t} i18nKey="banners.deprecated-document-type-banner.text" />{' '}
          {schemaType.deprecated.reason}
        </Text>
      }
      data-testid="deprecated-document-type-banner"
      icon={ErrorOutlineIcon}
    />
  )
}
