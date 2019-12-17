import * as defaultActions from './defaultActions'

export function resolveActions(documentState) {
  return Object.values(defaultActions)
}
