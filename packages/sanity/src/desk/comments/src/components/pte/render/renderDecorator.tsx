import React from 'react'
import {BlockDecoratorRenderProps, RenderDecoratorFunction} from '@sanity/portable-text-editor'
import {Decorator} from '../blocks'

export const renderDecorator: RenderDecoratorFunction = (
  decoratorProps: BlockDecoratorRenderProps,
) => {
  const {value, children} = decoratorProps
  return <Decorator decorator={value}>{children}</Decorator>
}
