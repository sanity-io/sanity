import {Box, Text} from '@sanity/ui'
import {IntentLink} from 'sanity/router'

import {useTranslation} from '../../../../i18n'
import {VARIANTS_INTENT} from '../../../../variants/plugin'
import {useAllVariants} from '../../../../variants/store/useAllVariants'
import {getVariantId, getVariantTitle} from '../../../../variants/tool/util'
import {Chip} from '../../../components/Chip'
import {releasesLocaleNamespace} from '../../../i18n'
import {type BundleDocument} from '../useBundleDocuments'
import {getVariantDefinitionRef} from './getVariantBundleSortKey'

function getVariantBundleLabel(
  variantRef: string,
  variantsById: ReturnType<typeof useAllVariants>['byId'],
): string {
  const variant = variantsById.get(variantRef)
  return variant ? getVariantTitle(variant) : getVariantId(variantRef)
}

export function ReleaseVariantBundleChip({
  document,
}: {
  document: BundleDocument['document']
}): React.JSX.Element {
  const {t} = useTranslation(releasesLocaleNamespace)
  const {byId: variantsById} = useAllVariants()
  const variantRef = getVariantDefinitionRef(document)

  if (!variantRef) {
    return (
      <Box
        data-testid={`release-variant-bundle-default-${document._id}`}
        paddingX={2}
        style={{minWidth: 0}}
      >
        <Text muted size={1}>
          {t('table-cell.bundle.default')}
        </Text>
      </Box>
    )
  }

  const label = getVariantBundleLabel(variantRef, variantsById)

  return (
    <Box style={{minWidth: 0, overflow: 'hidden'}}>
      <IntentLink intent={VARIANTS_INTENT} params={{id: getVariantId(variantRef)}}>
        <Chip
          data-testid={`release-variant-bundle-chip-${document._id}`}
          mode="bleed"
          text={label}
        />
      </IntentLink>
    </Box>
  )
}
