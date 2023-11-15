import {ReactNode, createRef, useContext, useRef} from 'react'
import {pathFor} from '@sanity/util/paths'
import {PortableTextMemberItemsContext} from '../contexts/PortableTextMembers'
import {PortableTextMemberItem} from '../PortableTextInput'
import {ArrayOfObjectsItemMember, ObjectFormNode} from '../../../store'
import {isArrayOfObjectsFieldMember, isBlockType} from '../_helpers'
import {isMemberArrayOfObjects} from '../../../members/object/fields/asserters'
import {pathToString} from '../../../../field'
import {FormInput} from '../../../components'
import {FIXME} from '../../../../FIXME'
import {PortableTextInputProps} from '../../../types'
import {PortableTextEditorElement} from '../Compositor'

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
  const portableTextMemberItemsRef: React.MutableRefObject<PortableTextMemberItem[]> = useRef([])
  reconcilePortableTextMembers({props, ref: portableTextMemberItemsRef})
  return portableTextMemberItemsRef.current
}

const reconcilePortableTextMembers = ({
  props,
  ref,
}: {
  props: PortableTextInputProps
  ref: React.MutableRefObject<PortableTextMemberItem[]>
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
        // Also include regular text blocks with validation, presence or changes.
        if (
          member.item.validation.length > 0 ||
          member.item.changed ||
          member.item.presence?.length
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
      const inputProps = {
        absolutePath: pathFor(item.node.path),
        includeField: false,
        members,
        path: pathFor(path),
        renderAnnotation,
        renderBlock,
        renderField,
        renderInlineBlock,
        renderInput,
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
