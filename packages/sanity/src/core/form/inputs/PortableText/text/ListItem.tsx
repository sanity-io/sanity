import {type PortableTextTextBlock} from '@sanity/types'
import {useMemo} from 'react'

import {type BlockListItemProps} from '../../../types/blockProps'
import {usePortableTextMemberSchemaTypes} from '../contexts/PortableTextMemberSchemaTypes'

const DefaultComponent = (dProps: BlockListItemProps) => {
  return <>{dProps.children}</>
}

type ListItemProps = {
  block: PortableTextTextBlock
  children: React.JSX.Element
  focused: boolean
  selected: boolean
}

export const ListItem = (props: ListItemProps) => {
  const {block, children, selected, focused} = props
  const schemaTypes = usePortableTextMemberSchemaTypes()
  const sanitySchemaType = schemaTypes.lists.find((type) => type.value === block.listItem)
  if (!sanitySchemaType) {
    // This should never happen
    throw new Error(`Could not find Sanity schema type for list item: ${block.listItem}`)
  }
  const {title, value, component: CustomComponent} = sanitySchemaType
  return useMemo(() => {
    const componentProps = {
      block,
      focused,
      level: block.level ?? 1,
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
  }, [CustomComponent, block, children, focused, sanitySchemaType, selected, title, value])
}
