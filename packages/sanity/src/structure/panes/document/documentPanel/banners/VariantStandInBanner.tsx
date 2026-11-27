import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {getDefaultVariant, getVariantTitle, Translate, usePerspective, useTranslation} from 'sanity'
import {Text} from 'ui5'

import {structureLocaleNamespace} from '../../../../i18n'
import {Banner} from './Banner'
import {VariantBadge} from './VariantBannerChips'

const chips = {VariantBadge}

/**
 * Drafts, with the selected variant published but no draft of it yet: the form shows the published
 * variant as a stand-in and the first edit creates the draft. Without this the form looks like any
 * draft. Neutral with the info icon, as the other variant banners, and no action: editing is the
 * action.
 *
 * @internal
 */
export function VariantStandInBanner() {
  const {t} = useTranslation(structureLocaleNamespace)
  const {selectedVariants} = usePerspective()
  const selectedVariant = getDefaultVariant(selectedVariants)
  const variantTitle = selectedVariant ? getVariantTitle(selectedVariant) : ''

  return (
    <Banner
      truncateChips
      tone="neutral"
      icon={InfoOutlineIcon}
      content={
        <Text size={1} as="div" trim={true} data-testid="variant-stand-in-banner">
          <Translate
            i18nKey="banners.variant.stand-in"
            t={t}
            values={{variantTitle}}
            components={chips}
          />
        </Text>
      }
    />
  )
}
