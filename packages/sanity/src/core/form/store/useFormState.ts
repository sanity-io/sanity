import {
  type ObjectSchemaType,
  type Path,
  type SanityDocument,
  type ValidationMarker,
} from '@sanity/types'
import {useMemo, useState} from 'react'

import {type TargetPerspective} from '../../perspective/types'
import {type FormNodePresence} from '../../presence'
import {isGoingToUnpublish} from '../../releases/util/isGoingToUnpublish'
import {useCurrentUser} from '../../store'
import {EMPTY_ARRAY} from '../../util/empty'
import {createCallbackResolver} from './conditional-property/createCallbackResolver'
import {createPrepareFormState} from './formState'
import {type NodeChronologyProps, type ObjectFormNode, type StateTree} from './types'
import {immutableReconcile} from './utils/immutableReconcile'

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

  // if a version is going to be unpublished, we don't want to show the validation errors
  // in the form
  const isVersionGoingToUnpublish =
    documentValue && isGoingToUnpublish(documentValue as SanityDocument)

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
    documentValue,
    comparisonValue,
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
}
