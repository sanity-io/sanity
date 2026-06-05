import {type Path} from '@sanity/types'
import {isEqual, pathFor} from '@sanity/util/paths'
import {type MutableRefObject, type ReactNode, useContext, useMemo, useRef} from 'react'
import {PortableTextMemberItemsContext} from 'sanity/_singletons'

import {pathToString} from '../../../../field'
import {type FIXME} from '../../../../FIXME'
import {FormInput} from '../../../components'
import {isMemberArrayOfObjects} from '../../../members/object/fields/asserters'
import {set} from '../../../patch/patch'
import {type FormPatch} from '../../../patch/types'
import {type ArrayOfObjectsItemMember, type ObjectFormNode} from '../../../store'
import {type ObjectInputProps, type PortableTextInputProps} from '../../../types'
import {isArrayOfObjectsFieldMember, isBlockType} from '../_helpers'
import {type PortableTextMemberItem} from '../PortableTextInput'

export function usePortableTextMemberItem(key: string): PortableTextMemberItem | undefined {
  const ctx = useContext(PortableTextMemberItemsContext)
  if (!ctx) {
    throw new Error('Form context not provided')
  }
  return ctx.find((m) => m.key === key)
}

export function usePortableTextMemberItems(): PortableTextMemberItem[] {
  const ctx = useContext(PortableTextMemberItemsContext)
  if (!ctx) {
    throw new Error('Form context not provided')
  }
  return ctx
}

/**
 * Returns a flat structure of all the form member items
 * included in this Portable Text Input.
 *
 * @internal
 */
export function usePortableTextMemberItemsFromProps(
  props: PortableTextInputProps,
): PortableTextMemberItem[] {
  const {
    members,
    path,
    schemaType,
    renderAnnotation,
    renderField,
    renderBlock,
    renderInput,
    renderItem,
    renderInlineBlock,
    renderPreview,
    onPathFocus,
  } = props

  const portableTextMemberItemsRef: MutableRefObject<PortableTextMemberItem[]> = useRef([])
  return useMemo(() => {
    const result: {
      kind: PortableTextMemberItem['kind']
      member: ArrayOfObjectsItemMember
      node: ObjectFormNode
    }[] = []

    // Recurse into any nested array-of-objects fields a block-object
    // contains. This handles classic depth-2 cases (block.children,
    // block.markDefs) and container-nested cases (e.g.
    // list.items[].content[].image), so form member items exist for
    // objects at any nesting depth and click-to-open-dialog works in
    // containers.
    function collectFromBlockItem(item: ArrayOfObjectsItemMember): void {
      const isObjectBlock = !isBlockType(item.item.schemaType)
      if (isObjectBlock) {
        result.push({kind: 'objectBlock', member: item, node: item.item})
        for (const field of item.item.members) {
          if (field.kind !== 'field' || !isMemberArrayOfObjects(field)) continue
          for (const child of field.field.members) {
            if (child.kind === 'item') {
              collectFromBlockItem(child)
            }
          }
        }
        return
      }

      // Also include regular text blocks with validation, presence, changes or that are open or focused.
      // This is a performance optimization to avoid accounting for blocks that
      // doesn't need to be re-rendered (which usually is most of the blocks).
      if (
        item.item.validation.length > 0 ||
        item.item.changed ||
        item.item.presence?.length ||
        item.open ||
        item.item.focusPath.length ||
        item.item.focused
      ) {
        result.push({kind: 'textBlock', member: item, node: item.item})
      }
      // Inline objects
      const childrenField = item.item.members.find(
        (f) => f.kind === 'field' && f.name === 'children',
      )
      if (
        childrenField &&
        childrenField.kind === 'field' &&
        isMemberArrayOfObjects(childrenField)
      ) {
        for (const child of childrenField.field.members) {
          if (child.kind === 'item' && child.item.schemaType.name !== 'span') {
            result.push({kind: 'inlineObject', member: child, node: child.item})
          }
        }
      }
      // Markdefs
      const markDefArrayMember = item.item.members
        .filter(isArrayOfObjectsFieldMember)
        .find((f) => f.name === 'markDefs')
      if (markDefArrayMember) {
        for (const child of markDefArrayMember.field.members) {
          if (child.kind === 'item' && child.item.schemaType.jsonType === 'object') {
            result.push({
              kind: 'annotation',
              member: child,
              node: child.item,
            })
          }
        }
      }
    }

    for (const member of members) {
      if (member.kind === 'item') {
        collectFromBlockItem(member)
      }
    }

    // eslint-disable-next-line react-hooks/refs -- @todo this should be fixed but it's difficult and needs research
    const items: PortableTextMemberItem[] = result.map((item) => {
      const key = pathToString(item.node.path)
      const existingItem = portableTextMemberItemsRef.current.find((refItem) => refItem.key === key)
      const isObject = item.kind !== 'textBlock'
      let input: ReactNode = null

      if ((isObject && item.member !== existingItem?.member) || item.node !== existingItem?.node) {
        // No-op when calling elementProps.onFocus or calling onPathFocus with an empty focusPath
        // This is to avoid closing the editing modal as it will focus the editor element itself.
        const _elementProps = (renderInputProps: ObjectInputProps) => ({
          ...renderInputProps.elementProps,
          onFocus: () => {
            // no-op
          },
        })
        const _onPathFocus = (focusPath: Path) => {
          const fullPath = item.member.item.path.concat(focusPath)
          if (focusPath.length === 0) {
            // no-op
            return
          }
          onPathFocus(fullPath.slice(path.length, fullPath.length))
        }

        // When an Input is trying to remove itself (unset([])), we want instead to clear the values from the object,
        // but keep the object itself. This is to avoid the array input to remove the array entirely when unsetting the last item (for instance with markDefs)
        // We also want the (empty) object there in order to be able to control the closing of the object modal properly, cleaning up, normalizing through the editor etc.
        const _onChangeDisableRemoveSelf = (objectFormRenderInputProps: ObjectInputProps) => {
          return (patch: FormPatch) => {
            // Special handling for unset([]) change
            if (patch.type === 'unset' && patch.path.length === 0) {
              objectFormRenderInputProps.onChange(
                set({_type: item.member.item.schemaType.name, _key: item.member.key}, patch.path),
              )
              return
            }
            // Original onChange
            objectFormRenderInputProps.onChange(patch)
          }
        }

        // Render object Input with no-ops for setting root focus, and unsetting the object.
        const _renderInput = (renderInputProps: ObjectInputProps) => {
          const isObjectInputPath = isEqual(renderInputProps.path, item.member.item.path)
          if (isObjectInputPath) {
            return renderInput({
              ...renderInputProps,
              onChange: _onChangeDisableRemoveSelf(renderInputProps),
              onPathFocus: _onPathFocus,
              elementProps: _elementProps(renderInputProps),
            } as ObjectInputProps)
          }
          return renderInput(renderInputProps)
        }
        const inputProps = {
          absolutePath: pathFor(item.node.path),
          includeField: false,
          members,
          path: pathFor(path),
          renderAnnotation,
          renderBlock,
          renderField,
          renderInlineBlock,
          renderInput: _renderInput,
          renderItem,
          renderPreview,
          schemaType,
        }
        input = <FormInput {...(inputProps as FIXME)} />
      }

      // Update existing item
      if (existingItem) {
        existingItem.member = item.member
        existingItem.node = item.node
        existingItem.input = input || existingItem.input
        return existingItem
      }

      return {
        kind: item.kind,
        key,
        member: item.member,
        node: item.node,
        input,
      }
    })

    // eslint-disable-next-line react-hooks/refs -- @todo this should be fixed but it's difficult and needs research
    portableTextMemberItemsRef.current = items

    return items
  }, [
    members,
    onPathFocus,
    path,
    renderAnnotation,
    renderBlock,
    renderField,
    renderInlineBlock,
    renderInput,
    renderItem,
    renderPreview,
    schemaType,
  ])
}
