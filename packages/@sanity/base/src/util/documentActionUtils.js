import {difference} from 'lodash'

const ACTIONS_FLAG = '__experimental_actions'

const DEFAULT_ACTIONS = ['create', 'update', 'delete', 'publish']
const VALID_ACTIONS = DEFAULT_ACTIONS

const readActions = schemaType =>
  ACTIONS_FLAG in schemaType ? schemaType[ACTIONS_FLAG] : DEFAULT_ACTIONS

const validateActions = (typeName, actions) => {
  if (!Array.isArray(actions)) {
    throw new Error(
      `The value of <type>.${ACTIONS_FLAG} should be an array with any of the actions ${VALID_ACTIONS.join(
        ', '
      )}`
    )
  }
  const invalid = difference(actions, VALID_ACTIONS)
  if (invalid.length > 0) {
    throw new Error(
      `Invalid action${
        invalid.length > 1 ? 's' : ''
      } configured for schema type "${typeName}": ${invalid.join(
        ', '
      )}. Valid actions are: ${VALID_ACTIONS.join(', ')}`
    )
  }
  return actions
}

export const resolveEnabledActions = schemaType =>
  validateActions(schemaType.name, readActions(schemaType))

export const isActionEnabled = (schemaType, action) =>
  resolveEnabledActions(schemaType).includes(action)
