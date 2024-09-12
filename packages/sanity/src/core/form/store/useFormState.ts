/* eslint-disable camelcase */

import {type ObjectSchemaType, type Path, type ValidationMarker} from '@sanity/types'
import {pathFor} from '@sanity/util/paths'
import {useMemo} from 'react'

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
export function useFormState<
  T extends {[key in string]: unknown} = {[key in string]: unknown},
  S extends ObjectSchemaType = ObjectSchemaType,
>(
  schemaType: ObjectSchemaType,
  {
    comparisonValue,
    value,
    fieldGroupState,
    collapsedFieldSets,
    collapsedPaths,
    focusPath,
    openPath,
    presence,
    validation,
    readOnly: inputReadOnly,
    changesOpen,
  }: {
    fieldGroupState?: StateTree<string> | undefined
    collapsedFieldSets?: StateTree<boolean> | undefined
    collapsedPaths?: StateTree<boolean> | undefined
    value: unknown
    comparisonValue: unknown
    openPath: Path
    focusPath: Path
    presence: FormNodePresence[]
    validation: ValidationMarker[]
    changesOpen?: boolean
    readOnly?: boolean
  },
): FormState<T, S> | null {
  // note: feel free to move these state pieces out of this hook
  const currentUser = useCurrentUser()

  const prepareHiddenState = useMemo(() => createCallbackResolver({property: 'hidden'}), [])
  const prepareReadOnlyState = useMemo(() => createCallbackResolver({property: 'readOnly'}), [])
  const prepareFormState = useMemo(() => createPrepareFormState(), [])

  const reconcileFieldGroupState = useMemo(() => {
    let last: StateTree<string> | undefined
    return (state: StateTree<string> | undefined) => {
      const result = immutableReconcile(last ?? null, state)
      last = result
      return result
    }
  }, [])

  const reconciledFieldGroupState = useMemo(() => {
    return reconcileFieldGroupState(fieldGroupState)
  }, [fieldGroupState, reconcileFieldGroupState])

  const reconcileCollapsedPaths = useMemo(() => {
    let last: StateTree<boolean> | undefined
    return (state: StateTree<boolean> | undefined) => {
      const result = immutableReconcile(last ?? null, state)
      last = result
      return result
    }
  }, [])
  const reconciledCollapsedPaths = useMemo(
    () => reconcileCollapsedPaths(collapsedPaths),
    [collapsedPaths, reconcileCollapsedPaths],
  )

  const reconcileCollapsedFieldsets = useMemo(() => {
    let last: StateTree<boolean> | undefined
    return (state: StateTree<boolean> | undefined) => {
      const result = immutableReconcile(last ?? null, state)
      last = result
      return result
    }
  }, [])
  const reconciledCollapsedFieldsets = useMemo(
    () => reconcileCollapsedFieldsets(collapsedFieldSets),
    [collapsedFieldSets, reconcileCollapsedFieldsets],
  )

  const {hidden, readOnly} = useMemo(() => {
    return {
      hidden: prepareHiddenState({
        currentUser,
        document: value,
        schemaType,
      }),
      readOnly: prepareReadOnlyState({
        currentUser,
        document: value,
        schemaType,
        readOnly: inputReadOnly,
      }),
    }
  }, [prepareHiddenState, currentUser, value, schemaType, prepareReadOnlyState, inputReadOnly])

  return useMemo(() => {
    return prepareFormState({
      schemaType,
      fieldGroupState: reconciledFieldGroupState,
      collapsedFieldSets: reconciledCollapsedFieldsets,
      collapsedPaths: reconciledCollapsedPaths,
      value,
      comparisonValue,
      focusPath,
      openPath,
      readOnly,
      hidden,
      path: pathFor([]),
      level: 0,
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
    value,
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
