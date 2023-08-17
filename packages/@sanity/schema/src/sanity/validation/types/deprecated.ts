import {SchemaValidationResult} from '../../typedefs'
import {warning} from '../createValidationResult'

export function validateDeprecatedProperties(type): SchemaValidationResult[] {
  const warnings = []

  if (type?.inputComponent) {
    warnings.push(
      warning(`The "inputComponent" property is deprecated. Use "components.input" instead.`),
    )
  }

  if (type?.preview?.component) {
    warnings.push(
      warning(`The "preview.component" property is deprecated. Use "components.preview" instead.`),
    )
  }

  if (type?.diffComponent) {
    warnings.push(
      warning(`The "diffComponent" property is deprecated. Use "components.diff" instead.`),
    )
  }

  if (type?.options?.editModal) {
    warnings.push(
      warning(`The "options.editModal" property is deprecated. Use "options.modal" instead.`),
    )
  }

  if (type?.options?.isHighlighted) {
    warnings.push(
      warning(
        `The "options.isHighlighted" property is deprecated. You can put fields behind a collapsed fieldset if you want to hide them from plain sight.`,
      ),
    )
  }

  return warnings
}
