import {BlockListItemRenderProps} from '@sanity/portable-text-editor'
import React, {useCallback, useMemo} from 'react'

export const ListItem = (props: BlockListItemRenderProps) => {
  const {block, type, selected, focused, level, value, renderDefault} = props
  const children = useMemo(() => renderDefault(props), [props, renderDefault])
  const _renderDefault = useCallback(() => children, [children])

  const CustomComponent = type.components?.item
  if (CustomComponent) {
    return (
      <CustomComponent
        block={block}
        focused={focused}
        level={level}
        renderDefault={_renderDefault}
        selected={selected}
        title={type.title}
        value={value}
      >
        {children}
      </CustomComponent>
    )
  }
  return children
}
