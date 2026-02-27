import {type BlockListItemRenderProps} from '@portabletext/editor'
import {useMemo} from 'react'

import {type BlockListItemProps} from '../../../types'
import {usePortableTextMemberSchemaTypes} from '../contexts/PortableTextMemberSchemaTypes'

const DefaultComponent = (dProps: BlockListItemProps) => {
  return <>{dProps.children}</>
}

export const ListItem = (props: BlockListItemRenderProps) => {
  const {block, children, schemaType, selected, focused, level, value} = props
  const schemaTypes = usePortableTextMemberSchemaTypes()
  const sanitySchemaType = schemaTypes.lists.find((type) => type.value === schemaType.value)
  if (!sanitySchemaType) {
    // This should never happen
    throw new Error(`Could not find Sanity schema type for list item: ${schemaType.value}`)
  }
  const {title, component: CustomComponent} = sanitySchemaType
  return useMemo(() => {
    const componentProps = {
      block,
      focused,
      level,
      renderDefault: DefaultComponent,
      schemaType: sanitySchemaType,
      selected,
      title,
      value,
    }
    return CustomComponent ? (
      <CustomComponent {...componentProps}>{children}</CustomComponent>
    ) : (
      <DefaultComponent {...componentProps}>{children}</DefaultComponent>
    )
  }, [CustomComponent, block, children, focused, level, sanitySchemaType, selected, title, value])
}
