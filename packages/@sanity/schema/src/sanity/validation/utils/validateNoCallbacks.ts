import {type SchemaValidationResult} from '../../typedefs'
import {error} from '../createValidationResult'
import {isComponentLike} from './isComponent'

/**
 * Validates that a type definition contains no callback functions or code.
 * This is useful for contexts where schemas need to be serializable.
 *
 * @internal
 */
export function validateNoCallbacks(typeDef: any): SchemaValidationResult[] {
  const problems: SchemaValidationResult[] = []

  problems.push(...validateConditionalProperties(typeDef))
  problems.push(...validateValueProperties(typeDef))
  problems.push(...validateComponents(typeDef))
  problems.push(...validateOptions(typeDef))
  problems.push(...validateFieldsetsAndGroups(typeDef))
  problems.push(...validateBlockSpecific(typeDef))

  return problems
}

function validateConditionalProperties(typeDef: any): SchemaValidationResult[] {
  const problems: SchemaValidationResult[] = []

  if (typeof typeDef.hidden === 'function') {
    problems.push(
      error(`The "hidden" property cannot be a function. Use a static boolean value instead.`),
    )
  }

  if (typeof typeDef.readOnly === 'function') {
    problems.push(
      error(`The "readOnly" property cannot be a function. Use a static boolean value instead.`),
    )
  }

  return problems
}

function validateValueProperties(typeDef: any): SchemaValidationResult[] {
  const problems: SchemaValidationResult[] = []

  if (typeof typeDef.initialValue === 'function') {
    problems.push(
      error(`The "initialValue" property cannot be a function. Use a static value instead.`),
    )
  }

  if (typeof typeDef.validation === 'function') {
    problems.push(
      error(`The "validation" property cannot be a function. Use static validation rules instead.`),
    )
  }

  if (typeDef.validation && typeof typeDef.validation === 'object') {
    const hasCustomValidator = checkForCustomValidators(typeDef.validation)
    if (hasCustomValidator) {
      problems.push(
        error(`Custom validation functions are not supported. Use only built-in validation rules.`),
      )
    }
  }

  if (typeDef.preview?.prepare && typeof typeDef.preview.prepare === 'function') {
    problems.push(error(`The "preview.prepare" property cannot be a function.`))
  }

  if (typeDef.blockEditor?.render) {
    problems.push(error(`The "blockEditor.render" property cannot be a function.`))
  }

  return problems
}

function validateComponents(typeDef: any): SchemaValidationResult[] {
  const problems: SchemaValidationResult[] = []

  if (!typeDef.components) {
    return problems
  }

  const componentProps = [
    'input',
    'field',
    'item',
    'preview',
    'diff',
    'block',
    'inlineBlock',
    'annotation',
  ]

  for (const prop of componentProps) {
    if (typeDef.components[prop] && isComponentLike(typeDef.components[prop])) {
      problems.push(error(`The "components.${prop}" property cannot be a component function.`))
    }
  }

  if (typeDef.components.portableText?.plugins) {
    problems.push(
      error(`The "components.portableText.plugins" property cannot contain plugin functions.`),
    )
  }

  return problems
}

function validateOptions(typeDef: any): SchemaValidationResult[] {
  const problems: SchemaValidationResult[] = []

  if (!typeDef.options || typeof typeDef.options !== 'object') {
    return problems
  }

  problems.push(...validateCommonOptions(typeDef.options))
  problems.push(...validateAssetSources(typeDef.options))
  problems.push(...validateOtherFunctionOptions(typeDef.options))

  return problems
}

function validateCommonOptions(options: any): SchemaValidationResult[] {
  const problems: SchemaValidationResult[] = []

  if (typeof options.filter === 'function') {
    problems.push(
      error(
        `The "options.filter" property cannot be a function. Use a static GROQ filter string with filterParams instead.`,
      ),
    )
  }

  if (typeof options.source === 'function') {
    problems.push(
      error(
        `The "options.source" property cannot be a function. Use a static string path instead.`,
      ),
    )
  }

  if (typeof options.slugify === 'function') {
    problems.push(error(`The "options.slugify" property cannot be a function.`))
  }

  if (typeof options.isUnique === 'function') {
    problems.push(error(`The "options.isUnique" property cannot be a function.`))
  }

  return problems
}

function validateAssetSources(options: any): SchemaValidationResult[] {
  const problems: SchemaValidationResult[] = []

  if (!Array.isArray(options.sources)) {
    return problems
  }

  for (let i = 0; i < options.sources.length; i++) {
    const source = options.sources[i]
    if (!source) continue

    if (source.component && isComponentLike(source.component)) {
      problems.push(
        error(`Asset source at index ${i} has a "component" property that cannot be a function.`),
      )
    }

    if (source.icon && isComponentLike(source.icon)) {
      problems.push(
        error(`Asset source at index ${i} has an "icon" property that cannot be a component.`),
      )
    }

    if (typeof source === 'function' || source.Uploader) {
      problems.push(error(`Asset source at index ${i} contains functions or classes.`))
    }
  }

  return problems
}

function validateOtherFunctionOptions(options: any): SchemaValidationResult[] {
  const problems: SchemaValidationResult[] = []
  const knownFunctionOptions = ['filter', 'source', 'slugify', 'isUnique']

  for (const [key, value] of Object.entries(options)) {
    if (typeof value === 'function' && !knownFunctionOptions.includes(key)) {
      problems.push(error(`The "options.${key}" property cannot be a function.`))
    }
  }

  return problems
}

function validateFieldsetsAndGroups(typeDef: any): SchemaValidationResult[] {
  const problems: SchemaValidationResult[] = []

  problems.push(...validateFieldsets(typeDef.fieldsets))
  problems.push(...validateGroups(typeDef.groups))

  return problems
}

function validateFieldsets(fieldsets: any): SchemaValidationResult[] {
  const problems: SchemaValidationResult[] = []

  if (!Array.isArray(fieldsets)) {
    return problems
  }

  for (let i = 0; i < fieldsets.length; i++) {
    const fieldset = fieldsets[i]
    if (!fieldset) continue

    if (typeof fieldset.hidden === 'function') {
      problems.push(
        error(`Fieldset at index ${i} has a "hidden" property that cannot be a function.`),
      )
    }

    if (typeof fieldset.readOnly === 'function') {
      problems.push(
        error(`Fieldset at index ${i} has a "readOnly" property that cannot be a function.`),
      )
    }
  }

  return problems
}

function validateGroups(groups: any): SchemaValidationResult[] {
  const problems: SchemaValidationResult[] = []

  if (!Array.isArray(groups)) {
    return problems
  }

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i]
    if (!group) continue

    if (typeof group.hidden === 'function') {
      problems.push(
        error(`Field group at index ${i} has a "hidden" property that cannot be a function.`),
      )
    }

    if (group.icon && isComponentLike(group.icon)) {
      problems.push(
        error(`Field group at index ${i} has an "icon" property that cannot be a component.`),
      )
    }
  }

  return problems
}

function validateBlockSpecific(typeDef: any): SchemaValidationResult[] {
  const problems: SchemaValidationResult[] = []

  if (typeDef.type !== 'block') {
    return problems
  }

  problems.push(...validateBlockStyles(typeDef.styles))
  problems.push(...validateBlockMarks(typeDef.marks))

  return problems
}

function validateBlockStyles(styles: any): SchemaValidationResult[] {
  const problems: SchemaValidationResult[] = []

  if (!Array.isArray(styles)) {
    return problems
  }

  for (let i = 0; i < styles.length; i++) {
    const style = styles[i]
    if (style?.component && isComponentLike(style.component)) {
      problems.push(
        error(`Block style at index ${i} has a "component" property that cannot be a function.`),
      )
    }
  }

  return problems
}

function validateBlockMarks(marks: any): SchemaValidationResult[] {
  const problems: SchemaValidationResult[] = []

  if (!marks) {
    return problems
  }

  if (Array.isArray(marks.decorators)) {
    for (let i = 0; i < marks.decorators.length; i++) {
      const decorator = marks.decorators[i]
      if (decorator?.component && isComponentLike(decorator.component)) {
        problems.push(
          error(
            `Block decorator at index ${i} has a "component" property that cannot be a function.`,
          ),
        )
      }
    }
  }

  if (Array.isArray(marks.annotations)) {
    for (let i = 0; i < marks.annotations.length; i++) {
      const annotation = marks.annotations[i]
      if (annotation?.component && isComponentLike(annotation.component)) {
        problems.push(
          error(
            `Block annotation at index ${i} has a "component" property that cannot be a function.`,
          ),
        )
      }
    }
  }

  return problems
}

/**
 * Checks if a validation rule or array of rules contains custom validators
 */
function checkForCustomValidators(validation: any): boolean {
  if (!validation) return false

  // If it's an array, check each item
  if (Array.isArray(validation)) {
    return validation.some((v) => checkForCustomValidators(v))
  }

  // Check if it's a Rule object with custom validators
  if (typeof validation === 'object') {
    // Look for _rules array which contains the actual validation rules
    if (Array.isArray(validation._rules)) {
      return validation._rules.some((rule: any) => {
        // Check if the rule has a custom validator function
        return rule.flag === 'custom' && typeof rule.constraint === 'function'
      })
    }

    // Also check for direct custom property (different Rule structure)
    if (typeof validation.custom === 'function') {
      return true
    }
  }

  return false
}
