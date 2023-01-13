import React, {useCallback, useMemo} from 'react'
import {BlockStyleRenderProps} from '@sanity/portable-text-editor'
import {Normal as FallbackComponent, TEXT_STYLES, TextContainer} from './textStyles'

export const Style = (props: BlockStyleRenderProps) => {
  const {block, focused, children, selected, type} = props
  const DefaultComponent = useMemo(
    () =>
      (block.style && TEXT_STYLES[block.style] ? TEXT_STYLES[block.style] : TEXT_STYLES[0]) ||
      FallbackComponent,
    [block.style]
  )

  const defaultRendered = useMemo(
    () => <DefaultComponent>{children}</DefaultComponent>,
    [DefaultComponent, children]
  )

  const renderDefault = useCallback(() => defaultRendered, [defaultRendered])

  const CustomComponent = type.component
  if (CustomComponent) {
    return (
      <CustomComponent
        block={block}
        title={type.title}
        value={type.value}
        selected={selected}
        focused={focused}
        renderDefault={renderDefault}
      >
        <TextContainer data-testid={`text-style--${block.style}`}>{children}</TextContainer>
      </CustomComponent>
    )
  }
  return defaultRendered
}
