import {warning} from '../createValidationResult'
import inspect from '../../inspect'
import {isInputComponentLike} from './isInputComponentLike'

export function validateInputComponent(typeDef: any) {
  if ('components' in typeDef && !isInputComponentLike(typeDef.components.input)) {
    return [
      warning(
        `The \`components.input\` property is set but does not appear to be a valid React component (expected a function, but saw ${inspect(
          typeDef.components.input
        )}). If you have imported a custom input component, please verify that you have imported the correct named/default export.`
      ),
    ]
  }

  return []
}
