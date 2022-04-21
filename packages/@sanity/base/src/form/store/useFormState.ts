import {isKeySegment, ObjectSchemaType, Path} from '@sanity/types'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {pathFor} from '@sanity/util/paths'
import {useCurrentUser} from '../../datastores'
import {PatchEvent} from '../patch'
import {StateTree} from './types'
import {PreparedProps, prepareFormProps, SanityDocument} from './formState'

import {immutableReconcile} from './utils/immutableReconcile'

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
  {value, onChange}: {onChange: (event: PatchEvent) => void; value: Partial<SanityDocument>}
): PreparedProps<unknown> | {hidden: true} {
  const currentUser = useCurrentUser()
  const [fieldGroupState, onSetFieldGroupState] = useState<StateTree<string>>()
  const [collapsedFields, onSetCollapsedFields] = useState<StateTree<boolean>>()
  const [collapsedFieldSets, onSetCollapsedFieldSets] = useState<StateTree<boolean>>()

  const handleOnSetCollapsedField = useCallback((collapsed: boolean, path: Path) => {
    onSetCollapsedFields((prevState) => setAtPath(prevState, path, collapsed))
  }, [])

  const handleOnSetCollapsedFieldSet = useCallback((collapsed: boolean, path: Path) => {
    onSetCollapsedFieldSets((prevState) => setAtPath(prevState, path, collapsed))
  }, [])

  const handleSetActiveFieldGroup = useCallback(
    (groupName: string, path: Path) =>
      onSetFieldGroupState((prevState) => setAtPath(prevState, path, groupName)),
    []
  )

  const prev = useRef<PreparedProps<unknown> | {hidden: true} | undefined>()

  useEffect(() => {
    prev.current = undefined
  }, [schemaType])

  return useMemo(() => {
    const next = prepareFormProps({
      type: schemaType,
      document: value,
      fieldGroupState,
      onSetActiveFieldGroup: handleSetActiveFieldGroup,
      onSetCollapsedField: handleOnSetCollapsedField,
      onSetCollapsedFieldSet: handleOnSetCollapsedFieldSet,
      collapsedFields,
      collapsedFieldSets,
      value,
      path: pathFor([]),
      onChange,
      level: 0,
      currentUser,
    })
    const reconciled = immutableReconcile(prev.current, next)
    prev.current = reconciled

    console.timeEnd('derive form state')

    return reconciled
  }, [
    //
    schemaType,
    value,
    fieldGroupState,
    handleSetActiveFieldGroup,
    handleOnSetCollapsedField,
    handleOnSetCollapsedFieldSet,
    collapsedFields,
    collapsedFieldSets,
    onChange,
    currentUser,
  ])
}
