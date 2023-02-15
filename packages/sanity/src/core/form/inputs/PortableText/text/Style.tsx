import React, {useCallback, useMemo} from 'react'
import {BlockStyleRenderProps} from '@sanity/portable-text-editor'
import {BlockStyleProps} from '../../../types'
import {Normal as FallbackComponent, TEXT_STYLES, TextContainer} from './textStyles'

export const Style = (props: BlockStyleRenderProps) => {
  const {block, focused, children, selected, schemaType} = props
  const DefaultComponentWithFallback = useMemo(
    () =>
      (block.style && TEXT_STYLES[block.style] ? TEXT_STYLES[block.style] : TEXT_STYLES[0]) ||
      FallbackComponent,
    [block.style]
  )

  const DefaultComponent = useCallback(
    (dProps: BlockStyleProps) => {
      return (
        <DefaultComponentWithFallback>
          <TextContainer data-testid={`text-style--${block.style}`}>
            {dProps.children}
          </TextContainer>
        </DefaultComponentWithFallback>
      )
    },
    [DefaultComponentWithFallback, block.style]
  )

  return useMemo(() => {
    const CustomComponent = schemaType.component
    const {title, value} = schemaType
    const _props = {
      block,
      focused,
      renderDefault: DefaultComponent,
      schemaType,
      selected,
      title,
      value,
    }
    return CustomComponent ? (
      <CustomComponent {..._props}>{children}</CustomComponent>
    ) : (
      <DefaultComponent {..._props}>{children}</DefaultComponent>
    )
  }, [DefaultComponent, block, children, focused, schemaType, selected])
}
