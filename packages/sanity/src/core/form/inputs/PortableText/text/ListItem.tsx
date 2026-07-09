import {type BlockListItemRenderProps} from '@portabletext/editor'
import {type PortableTextMemberSchemaTypes} from '@portabletext/sanity-bridge'
import {useMemo} from 'react'

import {type BlockListItemProps} from '../../../types'

const DefaultComponent = (dProps: BlockListItemProps) => {
  return <>{dProps.children}</>
}

type ListItemProps = Pick<
  BlockListItemRenderProps,
  'block' | 'children' | 'focused' | 'selected'
> & {
  /**
   * The list type's schema type, resolved by the caller against the
   * position's sub-schema. `undefined` when the schema doesn't define it.
   */
  sanitySchemaType: PortableTextMemberSchemaTypes['lists'][number] | undefined
}

export const ListItem = (props: ListItemProps) => {
  const {block, children, sanitySchemaType, selected, focused} = props
  return useMemo(() => {
    if (!sanitySchemaType) {
      // The value predates a schema change (for example a list type that was
      // removed). Render the block without list decoration instead of
      // crashing, matching the editor's own fallback for unknown list items.
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
