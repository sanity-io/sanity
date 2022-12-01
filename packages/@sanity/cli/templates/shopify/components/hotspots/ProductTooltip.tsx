import {useSchema} from 'sanity'
import {Box} from '@sanity/ui'
import {HotspotTooltipProps} from 'sanity-plugin-hotspot-array'

interface HotspotFields {
  productWithVariant?: {
    product: {
      _ref: string
    }
  }
}

export default function ProductPreview({value, renderPreview}: HotspotTooltipProps<HotspotFields>) {
  const productSchemaType = useSchema().get('product')
  return (
    <Box padding={2} style={{minWidth: 200}}>
      {value?.productWithVariant?.product?._ref && productSchemaType
        ? renderPreview({
            value: value?.productWithVariant?.product,
            schemaType: productSchemaType,
            layout: 'default',
          })
        : `No product selected`}
    </Box>
  )
}
