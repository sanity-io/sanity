import React from 'react'
import {RenderChildFunction, BlockChildRenderProps} from '@sanity/portable-text-editor'
import {MentionInlineBlock} from '../blocks'

/**
 * @beta
 * @hidden
 */
export const renderChild: RenderChildFunction = (childProps: BlockChildRenderProps) => {
  const {children, value, selected} = childProps

  const isMention = value._type === 'mention' && value.userId

  if (isMention) {
    return <MentionInlineBlock selected={selected} userId={value?.userId as string} />
  }

  return children
}
