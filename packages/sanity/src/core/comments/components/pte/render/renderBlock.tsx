import React from 'react'
import {RenderBlockFunction} from '@sanity/portable-text-editor'
import {NormalBlock} from '../blocks'

export const renderBlock: RenderBlockFunction = (blockProps) => {
  const {children} = blockProps

  return <NormalBlock>{children}</NormalBlock>
}
