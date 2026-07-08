import {type BlockListItemRenderProps} from '@portabletext/editor'
import {useMemo} from 'react'

import {type BlockListItemProps} from '../../../types'
import {usePortableTextMemberSchemaTypes} from '../contexts/PortableTextMemberSchemaTypes'

const DefaultComponent = (dProps: BlockListItemProps) => {
  return <>{dProps.children}</>
}

type ListItemProps = Pick<BlockListItemRenderProps, 'block' | 'children' | 'focused' | 'selected'>

export const ListItem = (props: ListItemProps) => {
  const {block, children, selected, focused} = props
  const schemaTypes = usePortableTextMemberSchemaTypes()
  const sanitySchemaType = schemaTypes.lists.find((type) => type.value === block.listItem)
  return useMemo(() => {
    if (!sanitySchemaType) {
      // The value predates a schema change (for example a list type that was
      // removed). Render the block without list decoration instead of
      // crashing, matching the editor's own fallback for unknown list items.
      console.warn(`Could not find Sanity schema type for list item: ${block.listItem}`)
      return <>{children}</>
    }
    const {title, value, component: CustomComponent} = sanitySchemaType
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
  }, [block, children, focused, sanitySchemaType, selected])
}
