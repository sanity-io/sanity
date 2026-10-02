import {type ConfigPropertyReducer} from '../../types'
import {appendUnique, declaredRegistrations} from '../resolveDocumentFeatures'
import {type DocumentFieldAction, type DocumentFieldActionsResolverContext} from './types'

/** @internal */
export const documentFieldActionsReducer: ConfigPropertyReducer<
  DocumentFieldAction[],
  DocumentFieldActionsResolverContext
> = (prev, {document}, context) => {
  const seeded = appendUnique(prev, declaredRegistrations(document, 'fieldAction'))

  const documentFieldActions = document?.unstable_fieldActions
  if (!documentFieldActions) return seeded

  if (typeof documentFieldActions === 'function') return documentFieldActions(seeded, context)
  if (Array.isArray(documentFieldActions)) return [...seeded, ...documentFieldActions]

  throw new Error(
    `Expected \`document.unstable_fieldActions\` to be an array or a function, but received ${typeof documentFieldActions}`,
  )
}
