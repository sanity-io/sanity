// import {difference} from 'lodash'
// import {generateHelpUrl as helpUrl} from '@sanity/generate-help-url'

// const ACTIONS_FLAG = '__experimental_actions'

// const DEFAULT_ACTIONS = ['create', 'update', 'delete', 'publish']
// const VALID_ACTIONS = DEFAULT_ACTIONS

// // todo: enable this when officially deprecating experimental actions
// const DEPRECATE_EXPERIMENTAL_ACTIONS = false

// const hasWarned = {}
// const readActions = (schemaType) => {
//   if (DEPRECATE_EXPERIMENTAL_ACTIONS && !(schemaType.name in hasWarned)) {
//     console.warn(`Heads up! Experimental actions is now deprecated and replaced by Document Actions. Read more about how to migrate on ${helpUrl(
//       'experimental-actions-replaced-by-document-actions'
//     )}".
// `)
//     hasWarned[schemaType.name] = true
//   }

//   return ACTIONS_FLAG in schemaType ? schemaType[ACTIONS_FLAG] : DEFAULT_ACTIONS
// }

// const validateActions = (typeName, actions) => {
//   if (!Array.isArray(actions)) {
//     throw new Error(
//       `The value of <type>.${ACTIONS_FLAG} should be an array with any of the actions ${VALID_ACTIONS.join(
//         ', '
//       )}`
//     )
//   }

//   const invalid = difference(actions, VALID_ACTIONS)

//   if (invalid.length > 0) {
//     throw new Error(
//       `Invalid action${
//         invalid.length > 1 ? 's' : ''
//       } configured for schema type "${typeName}": ${invalid.join(
//         ', '
//       )}. Valid actions are: ${VALID_ACTIONS.join(', ')}`
//     )
//   }
//   return actions
// }

// export const resolveEnabledActions = (schemaType) =>
//   validateActions(schemaType.name, readActions(schemaType))

// export const isActionEnabled = (schemaType, action) =>
//   resolveEnabledActions(schemaType).includes(action)

export {}
