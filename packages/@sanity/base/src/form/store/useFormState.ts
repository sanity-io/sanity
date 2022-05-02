import {isKeySegment, ObjectSchemaType, Path, ValidationMarker} from '@sanity/types'
import {useCallback, useLayoutEffect, useMemo, useRef, useState} from 'react'
import {pathFor} from '@sanity/util/paths'
import {useCurrentUser} from '../../datastores'
import {PatchEvent} from '../patch'
import {FormFieldPresence} from '../../presence'
import {ObjectInputProps, StateTree} from '../types'
import {prepareFormProps, SanityDocument} from './formState'

import {immutableReconcile} from './utils/immutableReconcile'
import {DocumentNode} from './types/nodes'

function setAtPath<T>(currentTree: StateTree<T> | undefined, path: Path, value: T): StateTree<T> {
  if (path.length === 0) {
    return {...(currentTree || {}), value}
  }
  const [head, ...tail] = path
  const key = isKeySegment(head) ? head._key : String(head)
  const children = currentTree?.children ?? {}
  return {
    value: currentTree?.value,
    children: {...children, [key]: setAtPath(children[key] || {}, tail, value)},
  }
}

export function useFormState(
  schemaType: ObjectSchemaType,
  {
    value,
    onChange,
    onFocus,
    onBlur,
    validation,
    presence,
    focusPath,
  }: {
    onChange: (event: PatchEvent) => void
    onFocus: (nextFocusPath: Path) => void
    onBlur: (path: Path) => void
    value: Partial<SanityDocument>
    validation: ValidationMarker[]
    focusPath: Path
    presence: FormFieldPresence[]
  }
): DocumentNode | null {
  // note: feel free to move these state pieces out of this hook
  const currentUser = useCurrentUser()
  const [fieldGroupState, onSetFieldGroupState] = useState<StateTree<string>>()
  const [expandedNodes, onSetExpandedNode] = useState<StateTree<boolean>>()
  const [expandedFieldSets, onSetExpandedFieldSets] = useState<StateTree<boolean>>()

  const handleOnSetExpandedPath = useCallback((expanded: boolean, path: Path) => {
    onSetExpandedNode((prevState) => setAtPath(prevState, path, expanded))
  }, [])

  const handleOnSetExpandedFieldSet = useCallback((expanded: boolean, path: Path) => {
    onSetExpandedFieldSets((prevState) => setAtPath(prevState, path, expanded))
  }, [])

  const handleSetActiveFieldGroup = useCallback(
    (groupName: string, path: Path) =>
      onSetFieldGroupState((prevState) => setAtPath(prevState, path, groupName)),
    []
  )

  const prev = useRef<DocumentNode | null>(null)

  useLayoutEffect(() => {
    prev.current = null
  }, [schemaType])

  return useMemo(() => {
    // console.time('derive form state')
    const next = prepareFormProps({
      type: schemaType,
      document: value,
      fieldGroupState,
      value,
      focusPath,
      path: pathFor([]),
      level: 0,
      currentUser,
    })

    const reconciled = immutableReconcile(prev.current, next)
    prev.current = reconciled
    // console.timeEnd('derive form state')
    return reconciled
  }, [
    schemaType,
    value,
    presence,
    validation,
    focusPath,
    fieldGroupState,
    handleSetActiveFieldGroup,
    handleOnSetExpandedPath,
    handleOnSetExpandedFieldSet,
    expandedNodes,
    expandedFieldSets,
    onChange,
    onFocus,
    onBlur,
    currentUser,
  ])
}
