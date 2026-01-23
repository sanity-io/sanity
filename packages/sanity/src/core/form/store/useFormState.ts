import {
  type ObjectSchemaType,
  type Path,
  type SanityDocument,
  type ValidationMarker,
} from '@sanity/types'
import {useEffect, useMemo, useState} from 'react'

import {type TargetPerspective} from '../../perspective/types'
import {type FormNodePresence} from '../../presence'
import {isGoingToUnpublish} from '../../releases/util/isGoingToUnpublish'
import {useCurrentUser} from '../../store'
import {EMPTY_ARRAY} from '../../util/empty'
import {createCallbackResolver} from './conditional-property/createCallbackResolver'
import {useRevealedPaths} from './contexts/RevealedPathsProvider'
import {createPrepareFormState} from './formState'
import {type NodeChronologyProps, type ObjectFormNode, type StateTree} from './types'
import {immutableReconcile} from './utils/immutableReconcile'

/**
 * Extract all paths that have `value: true` from a StateTree<boolean>
 */
function extractHiddenPaths(
  tree: StateTree<boolean> | undefined,
  prefix: string = '',
): Set<string> {
  const result = new Set<string>()
  if (!tree) return result

  // If this node has value: true, add the path
  if (tree.value === true && prefix) {
    result.add(prefix)
  }

  // Recurse into children
  if (tree.children) {
    for (const [key, child] of Object.entries(tree.children)) {
      // Skip fieldset and group keys
      if (key.startsWith('fieldset:') || key.startsWith('group:')) continue

      const childPath = prefix ? `${prefix}.${key}` : key
      const childPaths = extractHiddenPaths(child, childPath)
      for (const p of childPaths) {
        result.add(p)
      }
    }
  }

  return result
}

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
  revealedPaths?: Set<string>
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
  revealedPaths,
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

  // Get the context to update naturally hidden paths
  const {setNaturallyHiddenPaths} = useRevealedPaths()

  // Compute raw hidden state (without reveal overrides) to track which paths are naturally hidden
  const [prepareRawHiddenState] = useState(() => createCallbackResolver({property: 'hidden'}))
  const rawHidden = useMemo(() => {
    return prepareRawHiddenState({
      currentUser,
      documentValue: documentValue,
      schemaType,
      // No revealedPaths - compute raw hidden state
    })
  }, [prepareRawHiddenState, currentUser, documentValue, schemaType])

  // Update naturally hidden paths in context when raw hidden state changes
  useEffect(() => {
    const hiddenPaths = extractHiddenPaths(rawHidden)
    setNaturallyHiddenPaths(hiddenPaths)
  }, [rawHidden, setNaturallyHiddenPaths])

  const {hidden, readOnly} = useMemo(() => {
    return {
      hidden: prepareHiddenState({
        currentUser,
        documentValue: documentValue,
        schemaType,
        revealedPaths,
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
    revealedPaths,
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
