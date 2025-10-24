import {type Path} from '@sanity/types'
import {pathFor} from '@sanity/util/paths'
import {type RefObject, useCallback, useEffect, useState} from 'react'

import {type FormState, getExpandOperations, setAtPath, type StateTree} from './store'

interface FormLocationState {
  selectedFieldGroup: StateTree<string> | undefined
  collapsedPaths: StateTree<boolean> | undefined
  collapsedFieldSets: StateTree<boolean> | undefined
}

function expandPaths(
  prevState: FormLocationState,
  formState: FormState,
  path: Path,
): FormLocationState {
  const ops = getExpandOperations(formState, path)
  return ops.reduce((state: FormLocationState, op): FormLocationState => {
    if (op.type === 'expandPath') {
      return setCollapsedPath(state, op.path, false)
    }
    if (op.type === 'expandFieldSet') {
      return setFieldSetCollapsed(state, op.path, false)
    }
    if (op.type === 'setSelectedGroup') {
      return setSelectedFieldGroup(state, op.path, op.groupName)
    }
    // @ts-expect-error - all cases should be covered
    throw new Error(`Invalid expand operation: ${op.type}`)
  }, prevState)
}

function setFieldSetCollapsed(
  prevState: FormLocationState,
  path: Path,
  collapsed: boolean,
): FormLocationState {
  return {
    ...prevState,
    collapsedFieldSets: setAtPath(prevState.collapsedFieldSets, path, collapsed),
  }
}

function setCollapsedPath(
  prevState: FormLocationState,
  path: Path,
  collapsed: boolean,
): FormLocationState {
  return {
    ...prevState,
    collapsedPaths: setAtPath(prevState.collapsedPaths, path, collapsed),
  }
}
function setSelectedFieldGroup(
  prevState: FormLocationState,
  path: Path,
  group: string,
): FormLocationState {
  return {
    ...prevState,
    selectedFieldGroup: setAtPath(prevState.selectedFieldGroup, path, group),
  }
}

/**
 * Focus path is controlled, everything else is derived from focusPath + current state
 */
export function useFormLocationState(props: {
  focusPath: Path
  prevFormStateRef: RefObject<FormState | undefined>
}) {
  const {focusPath, prevFormStateRef} = props
  const [openPath, setOpenPath] = useState<Path>(pathFor([]))
  const [locationState, setLocationState] = useState<FormLocationState>({
    selectedFieldGroup: undefined,
    collapsedPaths: undefined,
    collapsedFieldSets: undefined,
  })

  const handleOnSetCollapsedPath = useCallback((path: Path, collapsed: boolean) => {
    setLocationState((prevState) => setCollapsedPath(prevState, path, collapsed))
  }, [])

  const handleOnSetCollapsedFieldSet = useCallback((path: Path, collapsed: boolean) => {
    setLocationState((prevState) => setFieldSetCollapsed(prevState, path, collapsed))
  }, [])

  const handleSetActiveFieldGroup = useCallback((path: Path, groupName: string) => {
    setLocationState((prevState) => setSelectedFieldGroup(prevState, path, groupName))
  }, [])

  /** When open path is set by user interaction */
  const handleSetOpenPath = useCallback(
    (path: Path) => {
      setOpenPath(path)

      setLocationState((currentState) => {
        if (!prevFormStateRef.current) {
          // this should never happen
          return currentState
        }
        return expandPaths(currentState, prevFormStateRef.current, path)
      })
    },
    [prevFormStateRef],
  )
  useEffect(() => {
    handleSetOpenPath(focusPath)
  }, [focusPath, handleSetOpenPath])

  return {
    openPath,
    onPathOpen: handleSetOpenPath,

    onSetActiveFieldGroup: handleSetActiveFieldGroup,
    onSetCollapsedPath: handleOnSetCollapsedPath,
    onSetCollapsedFieldSet: handleOnSetCollapsedFieldSet,
    ...locationState,
  }
}
