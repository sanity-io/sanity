import {type BlockListItemRenderProps} from '@portabletext/editor'
import {useMemo} from 'react'

import {type BlockListItemProps} from '../../../types'

const DefaultComponent = (dProps: BlockListItemProps) => {
  return <>{dProps.children}</>
}

export const ListItem = (props: BlockListItemRenderProps) => {
  const {block, children, schemaType, selected, focused, level, value} = props
  const {title, component: CustomComponent} = schemaType
  return useMemo(() => {
    const componentProps = {
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
      <CustomComponent {...componentProps}>{children}</CustomComponent>
    ) : (
      <DefaultComponent {...componentProps}>{children}</DefaultComponent>
    )
  }, [CustomComponent, block, children, focused, level, schemaType, selected, title, value])
}
