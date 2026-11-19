import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {Translate, useSetVariant, useTranslation} from 'sanity'
import {Text} from 'ui5'

import {structureLocaleNamespace} from '../../../../i18n'
import {Banner} from './Banner'
import {getRememberedVariantTitle} from './rememberedVariantTitles'
import {VariantBadge} from './VariantBannerChips'

const chips = {VariantName: VariantBadge}

/**
 * Shown when the variant requested via the router sticky param matches no `system.variant`
 * definition (it was deleted, or the URL names one that never existed). An explicit error
 * surface: an invalid variant selection must never silently behave like "no variant selected".
 * The variant is named by the title seen this session, never by its id, and Back to Default
 * clears the selection.
 */
export function VariantDefinitionNotFoundBanner({
  requestedVariantName,
}: {
  requestedVariantName: string
}) {
  const {t} = useTranslation(structureLocaleNamespace)
  const setVariant = useSetVariant()
  const title = getRememberedVariantTitle(requestedVariantName)

  return (
    <Banner
      tone="caution"
      icon={WarningOutlineIcon}
      content={
        <Text
          size={1}
          as="div"
          trim={true}
          tone="caution"
          data-testid="variant-definition-not-found-banner"
        >
          {title ? (
            <Translate
              i18nKey="banners.variant.definition-not-found"
              t={t}
              values={{name: title}}
              components={chips}
              componentProps={{variantLead: t('banners.variant.lead.variant')}}
            />
          ) : (
            t('banners.variant.definition-not-found-unknown')
          )}
        </Text>
      }
      action={{
        text: t('banners.variant.action.back-to-default'),
        mode: 'default',
        onClick: () => setVariant({variantId: undefined}),
      }}
    />
  )
}
