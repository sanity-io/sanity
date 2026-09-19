import {isPortableTextTextBlock, type PortableTextBlock} from '@sanity/types'
import {TextSkeleton} from '@sanity/ui'

import {FormItemSkeleton} from './FormItemSkeleton'

/**
 * Placeholder for a Portable Text block while a lazy block component loads. Text blocks get a
 * single text line at the editor's default size; block objects get the item row placeholder.
 *
 * @internal
 */
export function FormBlockSkeleton({value}: {value: PortableTextBlock}) {
  if (isPortableTextTextBlock(value)) {
    return (
      <TextSkeleton
        animated
        data-testid="form-text-block-skeleton"
        radius={1}
        style={{width: '60%'}}
      />
    )
  }

  return <FormItemSkeleton />
}
