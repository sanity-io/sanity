import {type RenderBlockFunction} from '@portabletext/editor'

import {NormalBlock} from '../blocks/NormalBlock'

export const renderBlock: RenderBlockFunction = (blockProps) => {
  const {children} = blockProps

  return <NormalBlock>{children}</NormalBlock>
}
