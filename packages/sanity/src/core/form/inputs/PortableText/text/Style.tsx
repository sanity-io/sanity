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
    (defaultComponentProps: BlockStyleProps) => {
      return (
        <DefaultComponentWithFallback>
          <TextContainer data-testid={`text-style--${block.style}`}>
            {defaultComponentProps.children}
          </TextContainer>
        </DefaultComponentWithFallback>
      )
    },
    [DefaultComponentWithFallback, block.style]
  )

  return useMemo(() => {
    const CustomComponent = schemaType.component
    const {title, value} = schemaType
    const componentProps = {
      block,
      focused,
      renderDefault: DefaultComponent,
      schemaType,
      selected,
      title,
      value,
    }
    return CustomComponent ? (
      <CustomComponent {...componentProps}>{children}</CustomComponent>
    ) : (
      <DefaultComponent {...componentProps}>{children}</DefaultComponent>
    )
  }, [DefaultComponent, block, children, focused, schemaType, selected])
}
