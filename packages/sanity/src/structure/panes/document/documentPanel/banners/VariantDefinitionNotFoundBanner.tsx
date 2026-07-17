import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {Text} from '@sanity/ui'
import {Translate, useTranslation} from 'sanity'

import {structureLocaleNamespace} from '../../../../i18n'
import {Banner} from './Banner'

/**
 * Shown when the variant requested via the router sticky param matches no `system.variant`
 * definition. An explicit error surface: an invalid variant selection must never silently
 * behave like "no variant selected".
 */
export function VariantDefinitionNotFoundBanner({
  requestedVariantName,
}: {
  requestedVariantName: string
}) {
  const {t} = useTranslation(structureLocaleNamespace)

  return (
    <Banner
      tone="caution"
      icon={WarningOutlineIcon}
      content={
        <Text size={1}>
          <Translate
            i18nKey="banners.variant.definition-not-found"
            t={t}
            values={{name: requestedVariantName}}
            components={{
              VariantName: ({children}) => <strong>{children}</strong>,
            }}
          />
        </Text>
      }
    />
  )
}
