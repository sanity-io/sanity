import {BlockListItemRenderProps} from '@sanity/portable-text-editor'
import React, {useCallback} from 'react'

export const ListItem = (props: BlockListItemRenderProps) => {
  const {block, children, type, selected, focused, level, value} = props
  const renderDefault = useCallback(() => <>{children}</>, [children])

  const CustomComponent = type.component
  if (CustomComponent) {
    return (
      <CustomComponent
        block={block}
        focused={focused}
        level={level}
        renderDefault={renderDefault}
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
