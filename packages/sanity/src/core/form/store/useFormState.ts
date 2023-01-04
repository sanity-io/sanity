/* eslint-disable camelcase */

import {ObjectSchemaType, Path, ValidationMarker} from '@sanity/types'
import {useLayoutEffect, useMemo, useRef} from 'react'
import {pathFor} from '@sanity/util/paths'
import {FormNodePresence} from '../../presence'
import {useCurrentUser} from '../../store'
import {StateTree, ObjectFormNode} from './types'
import {prepareFormState, FIXME_SanityDocument} from './formState'
import {immutableReconcile} from './utils/immutableReconcile'
import {DocumentFormNode} from './types/nodes'

/** @internal */
export type FormState<
  T extends {[key in string]: unknown} = {[key in string]: unknown},
  S extends ObjectSchemaType = ObjectSchemaType
> = ObjectFormNode<T, S>

/** @internal */
export function useFormState<
  T extends {[key in string]: unknown} = {[key in string]: unknown},
  S extends ObjectSchemaType = ObjectSchemaType
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
    readOnly,
    changesOpen,
  }: {
    fieldGroupState?: StateTree<string> | undefined
    collapsedFieldSets?: StateTree<boolean> | undefined
    collapsedPaths?: StateTree<boolean> | undefined
    value: Partial<FIXME_SanityDocument>
    comparisonValue: Partial<FIXME_SanityDocument> | null
    openPath: Path
    focusPath: Path
    presence: FormNodePresence[]
    validation: ValidationMarker[]
    changesOpen?: boolean
    readOnly?: boolean
  }
): FormState<T, S> | null {
  // note: feel free to move these state pieces out of this hook
  const currentUser = useCurrentUser()

  const prev = useRef<DocumentFormNode | null>(null)

  useLayoutEffect(() => {
    prev.current = null
  }, [schemaType])

  return useMemo(() => {
    // console.time('derive form state')
    const next = prepareFormState({
      schemaType,
      document: value,
      fieldGroupState,
      collapsedFieldSets,
      collapsedPaths,
      value,
      comparisonValue,
      focusPath,
      openPath,
      readOnly,
      path: pathFor([]),
      level: 0,
      currentUser,
      presence,
      validation,
      changesOpen,
    }) as ObjectFormNode<T, S> // TODO: remove type cast

    const reconciled = immutableReconcile(prev.current, next)
    prev.current = reconciled
    // console.timeEnd('derive form state')
    return reconciled
  }, [
    schemaType,
    value,
    fieldGroupState,
    collapsedFieldSets,
    collapsedPaths,
    comparisonValue,
    focusPath,
    openPath,
    readOnly,
    currentUser,
    presence,
    validation,
    changesOpen,
  ])
}
