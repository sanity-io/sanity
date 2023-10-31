import React, {ReactNode, createRef, startTransition, useCallback, useMemo, useRef} from 'react'
import {Stack} from '@sanity/ui'
import {EditorChange, Patch, PortableTextEditor} from '@sanity/portable-text-editor'
import {isBlockSchemaType} from '@sanity/types'
import {
  ArrayOfObjectsItemMember,
  FIXME,
  FormInput,
  InputProps,
  ObjectFormNode,
  PortableTextEditorElement,
  PortableTextInputProps,
  PortableTextMemberItem,
  SANITY_PATCH_TYPE,
  pathToString,
} from '../../../core'
import {useScratchPad} from '../../hooks/useScratchPad'
import {isMemberArrayOfObjects} from '../../../core/form/members/object/fields/asserters'
import {isArrayOfObjectsFieldMember} from '../../../core/form/inputs/PortableText/_helpers'
import {PortableTextMemberItemsProvider} from '../../../core/form/inputs/PortableText/contexts/PortableTextMembers'
import {Editable} from './Editable'

export const ScratchPadInput = function ScratchPadInput(props: InputProps) {
  const {onChange, schemaType, value, members, onPathFocus} = props as PortableTextInputProps
  const portableTextMemberItemsRef: React.MutableRefObject<PortableTextMemberItem[]> = useRef([])

  const {editorRef, onEditorFocus, onEditorBlur} = useScratchPad()

  const handleEditorChange = useCallback(
    (change: EditorChange) => {
      if (change.type === 'mutation') {
        onChange(toFormPatches(change.patches))
      }
      if (change.type === 'selection') {
        onEditorFocus()
        startTransition(() => {
          if (change.selection) {
            onPathFocus(change.selection.focus.path)
          }
        })
      }
      if (change.type === 'blur') {
        onEditorBlur()
      }
    },
    [onChange, onEditorBlur, onEditorFocus, onPathFocus],
  )

  // Populate the portableTextMembers Map
  const portableTextMemberItems: PortableTextMemberItem[] = useMemo(() => {
    const result: {
      kind: PortableTextMemberItem['kind']
      member: ArrayOfObjectsItemMember
      node: ObjectFormNode
    }[] = []

    for (const member of members) {
      if (member.kind === 'item') {
        const isObjectBlock = !isBlockSchemaType(member.item.schemaType)
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
      const existingItem = portableTextMemberItemsRef.current.find((ref) => ref.key === key)
      let input: ReactNode

      if (item.kind !== 'textBlock') {
        input = <FormInput absolutePath={item.node.path} {...(props as FIXME)} />
      }

      if (existingItem) {
        // Only update the input if the node is open or the value has changed
        // This is a performance optimization.
        if (item.member.open || existingItem.node.value !== item.node.value) {
          existingItem.input = input
        }
        existingItem.member = item.member
        existingItem.node = item.node
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

    portableTextMemberItemsRef.current = items

    return items
  }, [members, props])

  return (
    <Stack data-testid="scratchpad-input">
      <PortableTextMemberItemsProvider memberItems={portableTextMemberItems}>
        <PortableTextEditor
          onChange={handleEditorChange}
          schemaType={schemaType}
          value={value}
          ref={editorRef}
        >
          <Editable formProps={props as PortableTextInputProps} />
        </PortableTextEditor>
      </PortableTextMemberItemsProvider>
    </Stack>
  )
}

function toFormPatches(patches: any) {
  return patches.map((p: Patch) => ({...p, patchType: SANITY_PATCH_TYPE}))
}
