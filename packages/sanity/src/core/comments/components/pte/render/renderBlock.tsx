import {NormalBlock} from '../blocks'
import {type RenderBlockFunction} from '@portabletext/editor'

export const renderBlock: RenderBlockFunction = (blockProps) => {
  const {children} = blockProps

  return <NormalBlock>{children}</NormalBlock>
}
