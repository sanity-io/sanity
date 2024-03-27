import {type RenderBlockFunction} from '@sanity/portable-text-editor'

import {DescriptionInputBlock} from '../blocks'

export const renderBlock: RenderBlockFunction = (blockProps) => {
  const {children} = blockProps

  return <DescriptionInputBlock>{children}</DescriptionInputBlock>
}
