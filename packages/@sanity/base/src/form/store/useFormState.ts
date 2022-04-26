import {isKeySegment, ObjectSchemaType, Path, ValidationMarker} from '@sanity/types'
import {useCallback, useLayoutEffect, useMemo, useRef, useState} from 'react'
import {pathFor} from '@sanity/util/paths'
import {useCurrentUser} from '../../datastores'
import {FormFieldPresence} from '../../presence'
import {ObjectFieldProps, StateTree} from '../types'
import {prepareFormProps} from './formState'
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
  {
    value,
    validation,
    presence,
    focusPath,
  }: {
    value: Record<string, unknown>
    validation: ValidationMarker[]
    focusPath: Path
    presence: FormFieldPresence[]
  }
): {
  formState: ObjectFieldProps | {hidden: true}
  onSetActiveFieldGroup: (path: Path, groupName: string) => void
  onSetExpandedPath: (path: Path, expanded: boolean) => void
  onSetExpandedFieldSet: (path: Path, expanded: boolean) => void
} {
  // note: feel free to move these state pieces out of this hook
  const currentUser = useCurrentUser()
  const [fieldGroupState, setFieldGroupState] = useState<StateTree<string>>()
  const [expandedNodes, setExpandedNode] = useState<StateTree<boolean>>()
  const [expandedFieldSets, setExpandedFieldSets] = useState<StateTree<boolean>>()

  const handleOnSetExpandedPath = useCallback((path: Path, expanded: boolean) => {
    setExpandedNode((prevState) => setAtPath(prevState, path, expanded))
  }, [])

  const handleOnSetExpandedFieldSet = useCallback((path: Path, expanded: boolean) => {
    setExpandedFieldSets((prevState) => setAtPath(prevState, path, expanded))
  }, [])

  const handleOnSetActiveFieldGroup = useCallback(
    (path: Path, groupName: string) =>
      setFieldGroupState((prevState) => setAtPath(prevState, path, groupName)),
    []
  )

  const prev = useRef<ObjectFieldProps | {hidden: true} | undefined>()

  useLayoutEffect(() => {
    prev.current = undefined
  }, [schemaType])

  const formState = useMemo(() => {
    // console.time('derive form state')
    const next = prepareFormProps({
      type: schemaType,
      document: value,
      validation,
      presence,
      fieldGroupState,
      expandedPaths: expandedNodes,
      expandedFieldSets: expandedFieldSets,
      value,
      focusPath,
      path: pathFor([]),
      level: 0,
      currentUser,
      index: 0,
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
    expandedNodes,
    expandedFieldSets,
    currentUser,
  ])

  return {
    formState,
    onSetActiveFieldGroup: handleOnSetActiveFieldGroup,
    onSetExpandedFieldSet: handleOnSetExpandedFieldSet,
    onSetExpandedPath: handleOnSetExpandedPath,
  }
}
