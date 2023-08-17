import {ConfigPropertyReducer} from '../../types'
import {DocumentFieldAction, DocumentFieldActionsResolverContext} from './types'

/** @internal */
export const documentFieldActionsReducer: ConfigPropertyReducer<
  DocumentFieldAction[],
  DocumentFieldActionsResolverContext
> = (prev, {document}, context) => {
  const documentFieldActions = document?.unstable_fieldActions
  if (!documentFieldActions) return prev

  if (typeof documentFieldActions === 'function') return documentFieldActions(prev, context)
  if (Array.isArray(documentFieldActions)) return [...prev, ...documentFieldActions]

  throw new Error(
    `Expected \`document.unstable_fieldActions\` to be an array or a function, but received ${typeof documentFieldActions}`,
  )
}
