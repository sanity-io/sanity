import {generateHelpUrl} from '@sanity/generate-help-url'
import {SchemaType} from '@sanity/types'
import {difference} from 'lodash'

const ACTIONS_FLAG = '__experimental_actions'

const DEFAULT_ACTIONS = ['create', 'update', 'delete', 'publish']
const VALID_ACTIONS = DEFAULT_ACTIONS

// todo: enable this when officially deprecating experimental actions
const DEPRECATE_EXPERIMENTAL_ACTIONS = false

const hasWarned = {}
const readActions = (schemaType: SchemaType): string[] => {
  if (DEPRECATE_EXPERIMENTAL_ACTIONS && !(schemaType.name in hasWarned)) {
    console.warn(`Heads up! Experimental actions is now deprecated and replaced by Document Actions. Read more about how to migrate on ${generateHelpUrl(
      'experimental-actions-replaced-by-document-actions',
    )}".
`)
    hasWarned[schemaType.name] = true
  }

  return ACTIONS_FLAG in schemaType ? (schemaType[ACTIONS_FLAG] as string[]) : DEFAULT_ACTIONS
}

const validateActions = (typeName: string, actions: string[]) => {
  if (!Array.isArray(actions)) {
    throw new Error(
      `The value of <type>.${ACTIONS_FLAG} should be an array with any of the actions ${VALID_ACTIONS.join(
        ', ',
      )}`,
    )
  }

  const invalid = difference(actions, VALID_ACTIONS)

  if (invalid.length > 0) {
    throw new Error(
      `Invalid action${
        invalid.length > 1 ? 's' : ''
      } configured for schema type "${typeName}": ${invalid.join(
        ', ',
      )}. Valid actions are: ${VALID_ACTIONS.join(', ')}`,
    )
  }

  return actions
}

export const resolveEnabledActions = (schemaType: SchemaType): string[] =>
  validateActions(schemaType.name, readActions(schemaType))

export const isActionEnabled = (schemaType: SchemaType, action: string): boolean =>
  resolveEnabledActions(schemaType).includes(action)
