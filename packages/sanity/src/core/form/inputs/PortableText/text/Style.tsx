import {Text} from '@sanity/ui'
import {BlockStyleRenderProps} from '@sanity/portable-text-editor'
import React, {useCallback, useMemo} from 'react'
import {TEXT_STYLES} from './textStyles'

export const Style = (props: BlockStyleRenderProps) => {
  const {block, type, selected, focused, value, renderDefault} = props
  const DefaultComponent = useMemo(
    () => (block.style && TEXT_STYLES[block.style] ? TEXT_STYLES[block.style] : TEXT_STYLES[0]),
    [block.style]
  )

  const children = useMemo(() => renderDefault(props), [props, renderDefault])
  const _renderDefault = useCallback(() => children, [children])

  const CustomComponent = type.components?.item
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
  return <DefaultComponent>{children}</DefaultComponent>
}
