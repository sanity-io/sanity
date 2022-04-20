import {isKeySegment, ObjectSchemaType, Path} from '@sanity/types'
import {useCallback, useMemo, useState} from 'react'
import {pathFor} from '@sanity/util/paths'
import {useCurrentUser} from '../../datastores'
import {PatchEvent} from '../patch'
import {StateTree} from './types'
import {PreparedProps, prepareFormProps, SanityDocument} from './formState'

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

  return useMemo(() => {
    // console.time('derive form state')
    const state = prepareFormProps({
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
    // console.timeEnd('derive form state
    return state
  }, [
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
