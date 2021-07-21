import {warning} from '../createValidationResult'
import inspect from '../../inspect'
import {isReactComponentIsh} from './isReactComponentIsh'

export function validateInputComponent(typeDef: any) {
  if ('inputComponent' in typeDef && !isReactComponentIsh(typeDef.inputComponent)) {
    return [
      warning(
        `The \`inputComponent\` property is set but does not appear to be a valid React component (expected a function, but saw ${inspect(
          typeDef.inputComponent
        )}). If you have imported a custom input component, please verify that you have imported the correct named/default export.`
      ),
    ]
  }

  return []
}
