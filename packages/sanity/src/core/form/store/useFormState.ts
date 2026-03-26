import {
  type ConditionalPropertyCallbackContext,
  type ObjectSchemaType,
  type Path,
  type SanityDocumentLike,
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
  // eslint-disable-next-line react-hooks/refs -- keep the latest document value available to snapshot-keyed memos without changing object identity semantics that async hidden relies on
  documentValueRef.current = documentValue
  // eslint-disable-next-line react-hooks/refs -- keep the latest comparison value in sync for the memoized form-state computation without regressing async hidden updates
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
    void documentValueSnapshot

    const nextState = {
      hidden: prepareHiddenState({
        currentUser,
        // eslint-disable-next-line react-hooks/refs -- read the latest document value while the memo is invalidated by snapshots and resolver versions, preserving working async hidden behavior for in-place mutations
        documentValue: documentValueRef.current,
        getClient,
        schemaType,
      }),
      readOnly: prepareReadOnlyState({
        currentUser,
        // eslint-disable-next-line react-hooks/refs -- same rationale as hidden: keep readOnly resolution aligned with the current document without breaking snapshot-based invalidation
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
    documentValueSnapshot,
    getClient,
    schemaType,
    prepareReadOnlyState,
    inputReadOnly,
    readOnlyResolverVersion,
  ])

  // if a version is going to be unpublished, we don't want to show the validation errors
  // in the form
  const isVersionGoingToUnpublish =
    documentValue && isGoingToUnpublish(documentValue as SanityDocumentLike)

  const formState = useMemo(() => {
    void documentValueSnapshot
    void comparisonValueSnapshot

    // eslint-disable-next-line react-hooks/refs -- prepareFormState must see the latest document/comparison refs while this memo remains keyed by snapshots to preserve the working async hidden behavior
    return prepareFormState({
      schemaType,
      fieldGroupState: reconciledFieldGroupState,
      collapsedFieldSets: reconciledCollapsedFieldsets,
      collapsedPaths: reconciledCollapsedPaths,
      // eslint-disable-next-line react-hooks/refs -- prepareFormState is keyed by the surrounding memo deps; using the ref preserves the latest value without reintroducing the async hidden regression
      documentValue: documentValueRef.current,
      // eslint-disable-next-line react-hooks/refs -- mirror the current comparison snapshot for the memoized form-state build
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
    documentValueSnapshot,
    comparisonValueSnapshot,
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
