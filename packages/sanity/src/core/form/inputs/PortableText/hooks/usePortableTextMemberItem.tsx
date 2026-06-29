import {type Path} from '@sanity/types'
import {isEqual, pathFor} from '@sanity/util/paths'
import {type ReactNode, useContext, useMemo} from 'react'
import {PortableTextRootMembersContext} from 'sanity/_singletons'

import {pathToString} from '../../../../field'
import {type FIXME} from '../../../../FIXME'
import {FormInput} from '../../../components'
import {set} from '../../../patch/patch'
import {type FormPatch} from '../../../patch/types'
import {type ArrayOfObjectsItemMember, type ObjectFormNode} from '../../../store'
import {type ObjectInputProps} from '../../../types'
import {isBlockType} from '../_helpers'
import {resolveMemberAtPath} from './resolveMemberAtPath'

/** @internal */
export type PortableTextMemberItemKind = 'annotation' | 'textBlock' | 'objectBlock' | 'inlineObject'

/**
 * A resolved Portable Text form-store member, lazily classified and
 * built when a consumer looks it up by path.
 *
 * @internal
 */
export interface PortableTextMemberItem {
  kind: PortableTextMemberItemKind
  /** Member's full keyed path within the document, stringified. */
  key: string
  member: ArrayOfObjectsItemMember
  node: ObjectFormNode
  /** Form input for object-shaped members, null for text blocks. */
  input: ReactNode
}

function classifyMemberKind(
  member: ArrayOfObjectsItemMember,
  parentSchemaTypeName: string | undefined,
): PortableTextMemberItemKind {
  const schemaType = member.item.schemaType
  if (parentSchemaTypeName === 'markDefs') {
    return 'annotation'
  }
  if (isBlockType(schemaType)) {
    return 'textBlock'
  }
  // Inline objects sit inside a text block's `children` array. Anything
  // else that resolves as a non-block-typed array item is an object
  // block (including container instances, which are object blocks with
  // an inner PT array — classification doesn't distinguish them).
  if (parentSchemaTypeName === 'children') {
    return 'inlineObject'
  }
  return 'objectBlock'
}

function getParentArrayFieldName(targetPath: Path): string | undefined {
  // The path ends with a `{_key}` segment when it points at an array
  // item. The segment immediately before is the array field name when
  // the parent is an object — undefined when the parent is the root
  // array.
  if (targetPath.length < 2) {
    return undefined
  }
  const fieldSegment = targetPath[targetPath.length - 2]
  return typeof fieldSegment === 'string' ? fieldSegment : undefined
}

function noopElementProps(renderInputProps: ObjectInputProps) {
  return {
    ...renderInputProps.elementProps,
    onFocus: () => {
      // no-op — avoid closing the editing modal on focus
    },
  }
}

/**
 * Look up a Portable Text form-store member by its full path.
 *
 * Depth-agnostic — resolves through any nesting of containers, object
 * blocks, and inline children. Returns `undefined` when the path
 * doesn't resolve or doesn't point at an array item.
 *
 * The `input` field is built lazily for object-shaped members and
 * memoized against the underlying form-store node identity, so repeat
 * lookups across renders return a stable React element when the
 * member's data hasn't changed.
 *
 * @internal
 */
export function usePortableTextMemberItem(path: Path): PortableTextMemberItem | undefined {
  const ctx = useContext(PortableTextRootMembersContext)
  if (!ctx) {
    throw new Error('Form context not provided')
  }
  const {
    rootMembers,
    ptInputPath,
    schemaType,
    formInputMembers,
    renderAnnotation,
    renderBlock,
    renderField,
    renderInlineBlock,
    renderInput,
    renderItem,
    renderPreview,
    onPathFocus,
  } = ctx

  return useMemo(() => {
    const resolved = resolveMemberAtPath(rootMembers, ptInputPath, path)
    if (!resolved || resolved.kind !== 'item') {
      return undefined
    }
    const parentFieldName = getParentArrayFieldName(resolved.item.path)
    const kind = classifyMemberKind(resolved, parentFieldName)
    const key = pathToString(resolved.item.path)
    const isObject = kind !== 'textBlock'
    let input: ReactNode = null
    if (isObject) {
      const wrappedOnPathFocus = (focusPath: Path) => {
        if (focusPath.length === 0) return
        const fullPath = resolved.item.path.concat(focusPath)
        onPathFocus(fullPath.slice(ptInputPath.length))
      }
      const wrappedOnChange = (objectFormRenderInputProps: ObjectInputProps) => {
        return (patch: FormPatch) => {
          if (patch.type === 'unset' && patch.path.length === 0) {
            objectFormRenderInputProps.onChange(
              set({_type: resolved.item.schemaType.name, _key: resolved.key}, patch.path),
            )
            return
          }
          objectFormRenderInputProps.onChange(patch)
        }
      }
      const wrappedRenderInput = (renderInputProps: ObjectInputProps) => {
        const isObjectInputPath = isEqual(renderInputProps.path, resolved.item.path)
        if (isObjectInputPath) {
          return renderInput({
            ...renderInputProps,
            onChange: wrappedOnChange(renderInputProps),
            onPathFocus: wrappedOnPathFocus,
            elementProps: noopElementProps(renderInputProps),
          } as ObjectInputProps)
        }
        return renderInput(renderInputProps)
      }
      const inputProps = {
        absolutePath: pathFor(resolved.item.path),
        includeField: false,
        members: formInputMembers,
        path: pathFor(ptInputPath),
        renderAnnotation,
        renderBlock,
        renderField,
        renderInlineBlock,
        renderInput: wrappedRenderInput,
        renderItem,
        renderPreview,
        schemaType,
      }
      input = <FormInput {...(inputProps as FIXME)} />
    }
    return {kind, key, member: resolved, node: resolved.item, input}
  }, [
    rootMembers,
    ptInputPath,
    path,
    schemaType,
    formInputMembers,
    renderAnnotation,
    renderBlock,
    renderField,
    renderInlineBlock,
    renderInput,
    renderItem,
    renderPreview,
    onPathFocus,
  ])
}
