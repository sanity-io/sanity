import {BlockListItemRenderProps} from '@sanity/portable-text-editor'
import React, {useCallback, useMemo} from 'react'
import {BlockListItemProps} from '../../../types'

export const ListItem = (props: BlockListItemRenderProps) => {
  const {block, children, schemaType, selected, focused, level, value} = props
  const {title, component: CustomComponent} = schemaType
  const DefaultComponent = useCallback((dProps: BlockListItemProps) => {
    return <>{dProps.children}</>
  }, [])
  return useMemo(() => {
    const _props = {
      block,
      focused,
      level,
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
  }, [
    CustomComponent,
    DefaultComponent,
    block,
    children,
    focused,
    level,
    selected,
    schemaType,
    title,
    value,
  ])
}
