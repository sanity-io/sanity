import {Box} from '@sanity/ui'
import {IntentLink} from 'sanity/router'

import {VARIANTS_INTENT} from '../../../../variants/plugin'
import {useAllVariants} from '../../../../variants/store/useAllVariants'
import {getVariantId, getVariantTitle} from '../../../../variants/tool/util'
import {Chip} from '../../../components/Chip'
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
}): React.JSX.Element | null {
  const {byId: variantsById} = useAllVariants()
  const variantRef = getVariantDefinitionRef(document)

  if (!variantRef) return null

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
