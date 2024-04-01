import {type RenderBlockFunction} from '@sanity/portable-text-editor'

import {NormalBlock} from '../blocks/NormalBlock'

export const renderBlock: RenderBlockFunction = (blockProps) => {
  const {children} = blockProps

  return <NormalBlock>{children}</NormalBlock>
}
