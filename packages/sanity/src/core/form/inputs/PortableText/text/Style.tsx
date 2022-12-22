import {Text} from '@sanity/ui'
import {BlockStyleRenderProps} from '@sanity/portable-text-editor'
import React, {useCallback, useMemo} from 'react'
import {Normal as FallbackComponent, TEXT_STYLES} from './textStyles'

export const Style = (props: BlockStyleRenderProps) => {
  const {block, focused, children, selected, type, value} = props
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
  const _renderDefault = useCallback(() => defaultRendered, [defaultRendered])

  const CustomComponent = type.component
  if (CustomComponent) {
    return (
      <Text data-testid={`text-style--${value}`}>
        <CustomComponent
          block={block}
          title={type.title}
          value={type.value}
          selected={selected}
          focused={focused}
          renderDefault={_renderDefault}
        >
          {children}
        </CustomComponent>
      </Text>
    )
  }
  return defaultRendered
}
