/* eslint-disable camelcase */

import {type ObjectSchemaType, type Path, type ValidationMarker} from '@sanity/types'
import {useMemo, useState} from 'react'

import {type FormNodePresence} from '../../presence'
import {useCurrentUser} from '../../store'
import {createCallbackResolver} from './conditional-property/createCallbackResolver'
import {createPrepareFormState} from './formState'
import {type ObjectFormNode, type StateTree} from './types'
import {immutableReconcile} from './utils/immutableReconcile'

/** @internal */
export type FormState<
  T extends {[key in string]: unknown} = {[key in string]: unknown},
  S extends ObjectSchemaType = ObjectSchemaType,
> = ObjectFormNode<T, S>

/** @internal */
export interface UseFormStateOptions {
  schemaType: ObjectSchemaType
  documentValue: unknown
  comparisonValue: unknown
  openPath: Path
  focusPath: Path
  presence: FormNodePresence[]
  validation: ValidationMarker[]
  fieldGroupState?: StateTree<string> | undefined
  collapsedFieldSets?: StateTree<boolean> | undefined
  collapsedPaths?: StateTree<boolean> | undefined
  readOnly?: boolean
  changesOpen?: boolean
}

/** @internal */
export function useFormState<
  T extends {[key in string]: unknown} = {[key in string]: unknown},
  S extends ObjectSchemaType = ObjectSchemaType,
>({
  comparisonValue,
  documentValue,
  fieldGroupState,
  collapsedFieldSets,
  collapsedPaths,
  focusPath,
  openPath,
  presence,
  validation,
  readOnly: inputReadOnly,
  changesOpen,
  schemaType,
}: UseFormStateOptions): FormState<T, S> | null {
  // note: feel free to move these state pieces out of this hook
  const currentUser = useCurrentUser()

  const [prepareHiddenState] = useState(() => createCallbackResolver({property: 'hidden'}))
  const [prepareReadOnlyState] = useState(() => createCallbackResolver({property: 'readOnly'}))
  const [prepareFormState] = useState(() => createPrepareFormState())

  const [reconcileFieldGroupState] = useState(() => {
    let last: StateTree<string> | undefined
    return (state: StateTree<string> | undefined) => {
      const result = immutableReconcile(last ?? null, state)
      last = result
      return result
    }
  })

  const reconciledFieldGroupState = useMemo(() => {
    return reconcileFieldGroupState(fieldGroupState)
  }, [fieldGroupState, reconcileFieldGroupState])

  const [reconcileCollapsedPaths] = useState(() => {
    let last: StateTree<boolean> | undefined
    return (state: StateTree<boolean> | undefined) => {
      const result = immutableReconcile(last ?? null, state)
      last = result
      return result
    }
  })
  const reconciledCollapsedPaths = useMemo(
    () => reconcileCollapsedPaths(collapsedPaths),
    [collapsedPaths, reconcileCollapsedPaths],
  )

  const [reconcileCollapsedFieldsets] = useState(() => {
    let last: StateTree<boolean> | undefined
    return (state: StateTree<boolean> | undefined) => {
      const result = immutableReconcile(last ?? null, state)
      last = result
      return result
    }
  })
  const reconciledCollapsedFieldsets = useMemo(
    () => reconcileCollapsedFieldsets(collapsedFieldSets),
    [collapsedFieldSets, reconcileCollapsedFieldsets],
  )

  const {hidden, readOnly} = useMemo(() => {
    return {
      hidden: prepareHiddenState({
        currentUser,
        documentValue: documentValue,
        schemaType,
      }),
      readOnly: prepareReadOnlyState({
        currentUser,
        documentValue: documentValue,
        schemaType,
        readOnly: inputReadOnly,
      }),
    }
  }, [
    prepareHiddenState,
    currentUser,
    documentValue,
    schemaType,
    prepareReadOnlyState,
    inputReadOnly,
  ])

  return useMemo(() => {
    return prepareFormState({
      schemaType,
      fieldGroupState: reconciledFieldGroupState,
      collapsedFieldSets: reconciledCollapsedFieldsets,
      collapsedPaths: reconciledCollapsedPaths,
      documentValue,
      comparisonValue,
      focusPath,
      openPath,
      readOnly,
      hidden,
      currentUser,
      presence,
      validation,
      changesOpen,
    }) as ObjectFormNode<T, S>
  }, [
    prepareFormState,
    schemaType,
    reconciledFieldGroupState,
    reconciledCollapsedFieldsets,
    reconciledCollapsedPaths,
    documentValue,
    comparisonValue,
    focusPath,
    openPath,
    readOnly,
    hidden,
    currentUser,
    presence,
    validation,
    changesOpen,
  ])
}
