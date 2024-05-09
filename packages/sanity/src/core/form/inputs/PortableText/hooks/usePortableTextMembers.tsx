import {isEqual, pathFor} from '@sanity/util/paths'
import {createRef, type MutableRefObject, type ReactNode, useContext, useRef} from 'react'
import {PortableTextMemberItemsContext} from 'sanity/_singletons'

import {pathToString} from '../../../../field'
import {type FIXME} from '../../../../FIXME'
import {FormInput} from '../../../components'
import {isMemberArrayOfObjects} from '../../../members/object/fields/asserters'
import {type ArrayOfObjectsItemMember, type ObjectFormNode} from '../../../store'
import {type ObjectInputProps, type PortableTextInputProps} from '../../../types'
import {isArrayOfObjectsFieldMember, isBlockType} from '../_helpers'
import {type PortableTextEditorElement} from '../Compositor'
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
  const portableTextMemberItemsRef: MutableRefObject<PortableTextMemberItem[]> = useRef([])
  reconcilePortableTextMembers({props, ref: portableTextMemberItemsRef})
  return portableTextMemberItemsRef.current
}

const reconcilePortableTextMembers = ({
  props,
  ref,
}: {
  props: PortableTextInputProps
  ref: MutableRefObject<PortableTextMemberItem[]>
}) => {
  const result: {
    kind: PortableTextMemberItem['kind']
    member: ArrayOfObjectsItemMember
    node: ObjectFormNode
  }[] = []
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
  } = props
  for (const member of members) {
    if (member.kind === 'item') {
      const isObjectBlock = !isBlockType(member.item.schemaType)
      if (isObjectBlock) {
        result.push({kind: 'objectBlock', member, node: member.item})
      } else {
        // Also include regular text blocks with validation, presence, changes or that are open or focused.
        // This is a performance optimization to avoid accounting for blocks that
        // doesn't need to be re-rendered (which usually is most of the blocks).
        if (
          member.item.validation.length > 0 ||
          member.item.changed ||
          member.item.presence?.length ||
          member.open ||
          member.item.focusPath.length ||
          member.item.focused
        ) {
          result.push({kind: 'textBlock', member, node: member.item})
        }
        // Inline objects
        const childrenField = member.item.members.find(
          (f) => f.kind === 'field' && f.name === 'children',
        )
        if (
          childrenField &&
          childrenField.kind === 'field' &&
          isMemberArrayOfObjects(childrenField)
        ) {
          // eslint-disable-next-line max-depth
          for (const child of childrenField.field.members) {
            // eslint-disable-next-line max-depth
            if (child.kind === 'item' && child.item.schemaType.name !== 'span') {
              result.push({kind: 'inlineObject', member: child, node: child.item})
            }
          }
        }
        // Markdefs
        const markDefArrayMember = member.item.members
          .filter(isArrayOfObjectsFieldMember)
          .find((f) => f.name === 'markDefs')
        if (markDefArrayMember) {
          // eslint-disable-next-line max-depth
          for (const child of markDefArrayMember.field.members) {
            // eslint-disable-next-line max-depth
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
    }
  }

  const items: PortableTextMemberItem[] = result.map((item) => {
    const key = pathToString(item.node.path)
    const existingItem = ref.current.find((refItem) => refItem.key === key)
    const isObject = item.kind !== 'textBlock'
    let input: ReactNode = null

    if ((isObject && item.member !== existingItem?.member) || item.node !== existingItem?.node) {
      // Render input with onFocus noop for calling elementProps.onFocus directly on the editor nodes themselves
      // This is to avoid closing the editing modal for them in the PT-input setting.
      const _renderInput = (renderInputProps: ObjectInputProps) => {
        const isObjectInputPath = isEqual(renderInputProps.path, item.member.item.path)
        if (isObjectInputPath) {
          return renderInput({
            ...renderInputProps,
            elementProps: {
              ...renderInputProps.elementProps,
              onFocus: () => {
                // no-op
              },
            },
          })
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
      elementRef: createRef<PortableTextEditorElement | null>(),
      input,
    }
  })

  ref.current = items

  return items
}
