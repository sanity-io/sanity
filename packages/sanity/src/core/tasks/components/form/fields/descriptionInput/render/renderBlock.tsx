import {type RenderBlockFunction} from '@portabletext/editor'

import {DescriptionInputBlock} from '../blocks'

export const renderBlock: RenderBlockFunction = (blockProps) => {
  const {children} = blockProps

  return <DescriptionInputBlock>{children}</DescriptionInputBlock>
}
