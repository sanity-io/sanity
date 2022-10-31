import {warning} from '../createValidationResult'
import inspect from '../../inspect'
import type {SchemaValidationResult} from '../../typedefs'
import {isComponentLike} from './isComponent'

export function validateComponent(typeDef: any): SchemaValidationResult[] {
  const components = 'components' in typeDef ? typeDef.components : false
  if (!components) {
    return []
  }

  const warnings: SchemaValidationResult[] = []

  if (components.input && !isComponentLike(components.input)) {
    warnings.push(
      warning(
        `The \`components.input\` property is set but does not appear to be a valid React component (expected a function, but saw ${inspect(
          components.input
        )}). If you have imported a custom input component, please verify that you have imported the correct named/default export.`
      )
    )
  }

  if (components.field && !isComponentLike(components.field)) {
    warnings.push(
      warning(
        `The \`components.field\` property is set but does not appear to be a valid React component (expected a function, but saw ${inspect(
          components.field
        )}). If you have imported a custom field component, please verify that you have imported the correct named/default export.`
      )
    )
  }

  if (components.item && !isComponentLike(components.item)) {
    warnings.push(
      warning(
        `The \`components.item\` property is set but does not appear to be a valid React component (expected a function, but saw ${inspect(
          components.item
        )}). If you have imported a custom item component, please verify that you have imported the correct named/default export.`
      )
    )
  }

  if (components.preview && !isComponentLike(components.preview)) {
    warnings.push(
      warning(
        `The \`components.preview\` property is set but does not appear to be a valid React component (expected a function, but saw ${inspect(
          components.preview
        )}). If you have imported a custom preview component, please verify that you have imported the correct named/default export.`
      )
    )
  }

  return warnings
}
