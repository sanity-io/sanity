import {
  type ConditionalPropertyCallbackContext,
  type ObjectSchemaType,
  type Path,
  type SanityDocument,
  type ValidationMarker,
} from '@sanity/types'
import {useMemo, useRef, useState, useSyncExternalStore} from 'react'

import {type TargetPerspective} from '../../perspective/types'
import {type FormNodePresence} from '../../presence'
import {isGoingToUnpublish} from '../../releases/util/isGoingToUnpublish'
import {useCurrentUser} from '../../store'
import {EMPTY_ARRAY} from '../../util/empty'
import {createCallbackResolver} from './conditional-property/createCallbackResolver'
import {createPrepareFormState} from './formState'
import {type NodeChronologyProps, type ObjectFormNode, type StateTree} from './types'
import {immutableReconcile} from './utils/immutableReconcile'
import {stableStringify} from './utils/stableStringify'

/** @internal */
export type FormState<
  T extends {[key in string]: unknown} = {[key in string]: unknown},
  S extends ObjectSchemaType = ObjectSchemaType,
> = ObjectFormNode<T, S>

/** @internal */
export interface UseFormStateOptions extends Pick<NodeChronologyProps, 'hasUpstreamVersion'> {
  schemaType: ObjectSchemaType
  documentValue: unknown
  comparisonValue: unknown
  getClient?: ConditionalPropertyCallbackContext['getClient']
  openPath: Path
  focusPath: Path
  perspective: TargetPerspective
  presence: FormNodePresence[]
  validation: ValidationMarker[]
  fieldGroupState?: StateTree<string> | undefined
  collapsedFieldSets?: StateTree<boolean> | undefined
  collapsedPaths?: StateTree<boolean> | undefined
  readOnly?: boolean
  changesOpen?: boolean
  displayInlineChanges?: boolean
}

/** @internal */
export function useFormState<
  T extends {[key in string]: unknown} = {[key in string]: unknown},
  S extends ObjectSchemaType = ObjectSchemaType,
>({
  comparisonValue,
  documentValue,
  getClient,
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
  perspective,
  hasUpstreamVersion,
  displayInlineChanges,
}: UseFormStateOptions): FormState<T, S> | null {
  // note: feel free to move these state pieces out of this hook
  const currentUser = useCurrentUser()

  const [prepareHiddenState] = useState(() => createCallbackResolver({property: 'hidden'}))
  const [prepareReadOnlyState] = useState(() => createCallbackResolver({property: 'readOnly'}))
  const [prepareFormState] = useState(() => createPrepareFormState())
  const hiddenResolverVersion = useSyncExternalStore(
    prepareHiddenState.subscribe,
    prepareHiddenState.getVersion,
    prepareHiddenState.getVersion,
  )
  const readOnlyResolverVersion = useSyncExternalStore(
    prepareReadOnlyState.subscribe,
    prepareReadOnlyState.getVersion,
    prepareReadOnlyState.getVersion,
  )
  const documentValueSnapshot = stableStringify(documentValue)
  const comparisonValueSnapshot = stableStringify(comparisonValue)
  const documentValueRef = useRef(documentValue)
  const comparisonValueRef = useRef(comparisonValue)
  documentValueRef.current = documentValue
  comparisonValueRef.current = comparisonValue

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
    void hiddenResolverVersion
    void readOnlyResolverVersion

    const nextState = {
      hidden: prepareHiddenState({
        currentUser,
        documentValue: documentValueRef.current,
        getClient,
        schemaType,
      }),
      readOnly: prepareReadOnlyState({
        currentUser,
        documentValue: documentValueRef.current,
        getClient,
        schemaType,
        readOnly: inputReadOnly,
      }),
    }

    return nextState
  }, [
    hiddenResolverVersion,
    prepareHiddenState,
    currentUser,
    documentValueRef,
    getClient,
    schemaType,
    prepareReadOnlyState,
    inputReadOnly,
    readOnlyResolverVersion,
  ])

  // if a version is going to be unpublished, we don't want to show the validation errors
  // in the form
  const isVersionGoingToUnpublish =
    documentValue && isGoingToUnpublish(documentValue as SanityDocument)

  const formState = useMemo(() => {
    return prepareFormState({
      schemaType,
      fieldGroupState: reconciledFieldGroupState,
      collapsedFieldSets: reconciledCollapsedFieldsets,
      collapsedPaths: reconciledCollapsedPaths,
      documentValue: documentValueRef.current,
      comparisonValue: comparisonValueRef.current,
      focusPath,
      openPath,
      readOnly,
      hidden,
      currentUser,
      presence,
      validation: isVersionGoingToUnpublish ? EMPTY_ARRAY : validation,
      changesOpen,
      perspective,
      hasUpstreamVersion,
      displayInlineChanges,
    }) as ObjectFormNode<T, S>
  }, [
    prepareFormState,
    schemaType,
    reconciledFieldGroupState,
    reconciledCollapsedFieldsets,
    reconciledCollapsedPaths,
    documentValueRef,
    comparisonValueRef,
    focusPath,
    openPath,
    perspective,
    readOnly,
    hidden,
    currentUser,
    presence,
    isVersionGoingToUnpublish,
    validation,
    changesOpen,
    hasUpstreamVersion,
    displayInlineChanges,
  ])

  return formState
}
