/* eslint-disable camelcase */

import {ObjectSchemaType, Path} from '@sanity/types'
import {useLayoutEffect, useMemo, useRef} from 'react'
import {pathFor} from '@sanity/util/paths'
import {useCurrentUser} from '../../datastores'
import {StateTree} from '../types'
import {prepareFormProps, FIXME_SanityDocument} from './formState'

import {immutableReconcile} from './utils/immutableReconcile'
import {DocumentFormNode} from './types/nodes'

export function useFormState<
  T extends {[key in string]: unknown} = {[key in string]: unknown},
  S extends ObjectSchemaType = ObjectSchemaType
>(
  schemaType: ObjectSchemaType,
  {
    value,
    fieldGroupState,
    expandedFieldSets,
    collapsedPaths,
    focusPath,
    openPath,
  }: {
    fieldGroupState?: StateTree<string> | undefined
    expandedFieldSets?: StateTree<boolean> | undefined
    collapsedPaths?: StateTree<boolean> | undefined
    value: Partial<FIXME_SanityDocument>
    openPath: Path
    focusPath: Path
  }
) {
  // note: feel free to move these state pieces out of this hook
  const currentUser = useCurrentUser()

  const prev = useRef<DocumentFormNode | null>(null)

  useLayoutEffect(() => {
    prev.current = null
  }, [schemaType])

  return useMemo(() => {
    // console.time('derive form state')
    const next = prepareFormProps({
      schemaType,
      document: value,
      fieldGroupState,
      collapsedFieldSets: expandedFieldSets,
      collapsedPaths,
      value,
      focusPath,
      openPath,
      path: pathFor([]),
      level: 0,
      currentUser,
    })

    const reconciled = immutableReconcile(prev.current, next)
    prev.current = reconciled
    // console.timeEnd('derive form state')
    return reconciled
  }, [
    schemaType,
    value,
    fieldGroupState,
    expandedFieldSets,
    collapsedPaths,
    focusPath,
    openPath,
    currentUser,
  ])
}
