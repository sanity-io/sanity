import {useCallback} from 'react'

import {type SelectedPerspective} from '../perspective/types'
import {usePerspective} from '../perspective/usePerspective'
import {isReleaseDocument} from '../releases/store/types'
import {isPublishedPerspective} from '../releases/util/util'
import {useWorkspace} from '../studio/workspace'
import {type InitialValueTemplateItem} from '../templates/types'

/**
 * @internal
 */
export type FilterInitialValueTemplates = (
  initialValueTemplates: InitialValueTemplateItem[],
) => InitialValueTemplateItem[]

/**
 * @internal
 */
export interface DocumentCreationPolicyApi {
  documentCreationPolicy: number
  filterInitialValueTemplates: FilterInitialValueTemplates
}

/**
 * @internal
 */
// eslint-disable-next-line no-bitwise
export const NO_SCHEMA_TYPES = 0

/**
 * @internal
 */
// eslint-disable-next-line no-bitwise
export const LIVE_EDIT_SCHEMA_TYPES = 1 << 1

/**
 * @internal
 */
// eslint-disable-next-line no-bitwise
export const NON_LIVE_EDIT_SCHEMA_TYPES = 1 << 2

/**
 * @internal
 */
// eslint-disable-next-line no-bitwise
export const ALL_SCHEMA_TYPES = LIVE_EDIT_SCHEMA_TYPES | NON_LIVE_EDIT_SCHEMA_TYPES

/**
 * The document creation policy describes types of documents the user may create.
 *
 * For example: users may only create live-edit documents when the published perspective is applied.
 *
 * The hook provides a `filterInitialValueTemplates` function, which produces a new array containing
 * only the initial value templates currently available to the user.
 *
 * @internal
 */
export function useDocumentCreationPolicy(): DocumentCreationPolicyApi {
  const {
    document: {
      drafts: {enabled: isDraftModelEnabled},
    },
  } = useWorkspace()

  const {selectedPerspective} = usePerspective()

  const documentCreationPolicy = getDocumentCreationPolicy({
    selectedPerspective,
    isDraftModelEnabled,
  })

  const filterInitialValueTemplates = useCallback<FilterInitialValueTemplates>(
    (initialValueTemplates) => {
      // eslint-disable-next-line no-bitwise
      if ((documentCreationPolicy & ALL_SCHEMA_TYPES) === ALL_SCHEMA_TYPES) {
        return initialValueTemplates
      }

      // eslint-disable-next-line no-bitwise
      if ((documentCreationPolicy & LIVE_EDIT_SCHEMA_TYPES) === LIVE_EDIT_SCHEMA_TYPES) {
        return initialValueTemplates.filter(({liveEdit}) => liveEdit)
      }

      return []
    },
    [documentCreationPolicy],
  )

  return {
    documentCreationPolicy,
    filterInitialValueTemplates,
  }
}

function getDocumentCreationPolicy({
  selectedPerspective,
  isDraftModelEnabled,
}: {
  selectedPerspective: SelectedPerspective
  isDraftModelEnabled: boolean
}): number {
  if (isReleaseDocument(selectedPerspective) && selectedPerspective.state !== 'active') {
    return NO_SCHEMA_TYPES
  }

  if (
    isPublishedPerspective(selectedPerspective) ||
    (!isDraftModelEnabled && !isReleaseDocument(selectedPerspective))
  ) {
    return LIVE_EDIT_SCHEMA_TYPES
  }

  return ALL_SCHEMA_TYPES
}
