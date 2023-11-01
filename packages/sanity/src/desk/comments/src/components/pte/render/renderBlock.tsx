import React from 'react'
import {RenderBlockFunction} from '@sanity/portable-text-editor'
import {NormalBlock} from '../blocks'

/**
 * @beta
 * @hidden
 */
export const renderBlock: RenderBlockFunction = (blockProps) => {
  const {children} = blockProps

  return <NormalBlock>{children}</NormalBlock>
}
