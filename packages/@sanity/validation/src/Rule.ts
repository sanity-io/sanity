/* oxlint-disable typescript/no-deprecated -- this is the concrete implementation of the legacy Rule internals */
import {Rule as BaseRule} from '@sanity/schema'
import {
  type CustomValidator,
  type MediaValidator,
  type Rule as IRule,
  type RuleClass,
  type SchemaType,
  type SkippedValidation,
  type ValidationMarker,
  type Validator,
} from '@sanity/types'
import get from 'lodash-es/get.js'

import {ClientUnavailableError} from './clientUnavailable'
import {validationMarkerCodes} from './codes'
import {convertToValidationMarker} from './util/convertToValidationMarker'
import {isLocalizedMessages, localizeMessage} from './util/localizeMessage'
import {pathToString} from './util/pathToString'
import {arrayValidators} from './validators/arrayValidator'
import {booleanValidators} from './validators/booleanValidator'
import {dateValidators} from './validators/dateValidator'
import {genericValidators} from './validators/genericValidator'
import {numberValidators} from './validators/numberValidator'
import {objectValidators} from './validators/objectValidator'
import {stringValidators} from './validators/stringValidator'

const typeValidators = {
  Boolean: booleanValidators,
  Number: numberValidators,
  String: stringValidators,
  Array: arrayValidators,
  Object: objectValidators,
  Date: dateValidators,
}

const isFieldRef = (constraint: unknown): constraint is {type: symbol; path: string | string[]} => {
  if (typeof constraint !== 'object' || !constraint) return false
  return (constraint as Record<string, unknown>).type === Rule.FIELD_REF
}

const EMPTY_ARRAY: unknown[] = []

const fallbackCodeForRule = (flag: string) => {
  if (flag === 'custom') return validationMarkerCodes.custom
  if (flag === 'media') return validationMarkerCodes.mediaCustom
  if (flag === 'all') return validationMarkerCodes.ruleAllFailed
  if (flag === 'either') return validationMarkerCodes.ruleEitherFailed
  return validationMarkerCodes.validationFailed
}

/**
 * Concrete Rule implementation with validation logic.
 * This extends the base Rule class from `@sanity/schema` and adds the validate method.
 *
 * Note: `RuleClass` and `Rule` are split to fit the current `@sanity/types`
 * setup. Classes are a bit weird in the `@sanity/types` package because classes
 * create an actual javascript class while simultaneously creating a type
 * definition.
 *
 * This implicitly creates two types:
 * 1. the instance type — `Rule` and
 * 2. the static/class type - `RuleClass`
 *
 * The `RuleClass` type contains the static methods and the `Rule` instance
 * contains the instance methods.
 *
 * This package exports the RuleClass as a value without implicitly exporting
 * an instance definition. This should help reminder downstream users to import
 * from the `@sanity/types` package.
 *
 * @internal
 */
// export class Rule extends BaseRule implements IRule {
export const Rule: RuleClass = class Rule extends BaseRule implements IRule {
  static array = (def?: SchemaType): Rule => new Rule(def).type('Array')
  static object = (def?: SchemaType): Rule => new Rule(def).type('Object')
  static string = (def?: SchemaType): Rule => new Rule(def).type('String')
  static number = (def?: SchemaType): Rule => new Rule(def).type('Number')
  static boolean = (def?: SchemaType): Rule => new Rule(def).type('Boolean')
  static dateTime = (def?: SchemaType): Rule => new Rule(def).type('Date')

  clone(): Rule {
    const rule = new Rule()
    rule._type = this._type
    rule._message = this._message
    rule._required = this._required
    rule._rules = [...this._rules]
    rule._level = this._level
    rule._fieldRules = this._fieldRules
    rule._typeDef = this._typeDef
    return rule
  }

  async validate(
    value: unknown,
    {__internal = {}, ...context}: Parameters<IRule['validate']>[1],
  ): Promise<ValidationMarker[]> {
    const {customValidationConcurrencyLimiter} = __internal

    const valueIsEmpty = value === null || value === undefined

    // Short-circuit on optional, empty fields
    if (valueIsEmpty && this._required === 'optional') {
      return EMPTY_ARRAY as ValidationMarker[]
    }

    const rules =
      // Run only the _custom_ functions if the rule is not set to required or optional
      this._required === undefined && valueIsEmpty
        ? this._rules.filter((curr) => curr.flag === 'custom')
        : this._rules

    const validators = (this._type && typeValidators[this._type]) || genericValidators

    const results = await Promise.all(
      rules.map(async (curr) => {
        if (curr.flag === undefined) {
          throw new Error('Invalid rule, did not contain "flag"-property')
        }

        const validator: Validator | undefined = validators[curr.flag]
        if (!validator) {
          const forType = this._type ? `type "${this._type}"` : 'rule without declared type'
          throw new Error(`Validator for flag "${curr.flag}" not found for ${forType}`)
        }

        let specConstraint = 'constraint' in curr ? curr.constraint : null
        if (isFieldRef(specConstraint)) {
          specConstraint = get(context.parent, specConstraint.path)
        }

        const validationCallback = specConstraint as CustomValidator | MediaValidator | undefined
        const metadata = validationCallback?.__sanityValidation
        let validationCheck: SkippedValidation['check'] | undefined = metadata?.check
        if (!validationCheck && (curr.flag === 'custom' || curr.flag === 'media')) {
          validationCheck = curr.flag
        } else if (!validationCheck && curr.flag === 'reference') {
          validationCheck = 'referenceExistence'
        }
        let clientUnavailableReported = false
        const reportSkipped = (reason: SkippedValidation['reason']) => {
          if (!validationCheck) return
          if (reason === 'clientUnavailable') {
            if (clientUnavailableReported) return
            clientUnavailableReported = true
          }
          __internal.onSkipped?.({
            check: validationCheck,
            level: this._level || 'error',
            path: context.path || [],
            reason,
          })
        }

        if (curr.flag === 'custom' || curr.flag === 'media') {
          if (metadata?.kind === 'unavailable') {
            reportSkipped('validatorUnavailable')
            return []
          }

          if (metadata?.kind !== 'internal' && __internal.customValidation === false) {
            reportSkipped('customValidationDisabled')
            return []
          }
        }

        if (
          curr.flag === 'custom' &&
          customValidationConcurrencyLimiter &&
          !(specConstraint as CustomValidator)?.bypassConcurrencyLimit
        ) {
          const customValidator = specConstraint as CustomValidator
          specConstraint = async (...args: Parameters<CustomValidator>) => {
            await customValidationConcurrencyLimiter.ready(context.signal)
            try {
              context.signal?.throwIfAborted()
              return await customValidator(...args)
            } finally {
              customValidationConcurrencyLimiter.release()
            }
          }
        }

        const message = isLocalizedMessages(this._message)
          ? localizeMessage(this._message, context.i18n)
          : this._message

        const getDocumentExists = context.getDocumentExists
        const validatorContext = {
          ...context,
          getClient: (options: Parameters<typeof context.getClient>[0]) => {
            try {
              return context.getClient(options)
            } catch (error) {
              if (error instanceof ClientUnavailableError) reportSkipped('clientUnavailable')
              throw error
            }
          },
          getDocumentExists: getDocumentExists
            ? async (options: Parameters<typeof getDocumentExists>[0]) => {
                try {
                  return await getDocumentExists(options)
                } catch (error) {
                  if (error instanceof ClientUnavailableError) reportSkipped('clientUnavailable')
                  throw error
                }
              }
            : undefined,
          __internal: {...__internal, validationLevel: this._level || 'error'},
        }

        try {
          const result = await validator(specConstraint, value, message, validatorContext)
          return convertToValidationMarker(result, this._level, context, {
            code: fallbackCodeForRule(curr.flag),
          })
        } catch (err) {
          context.signal?.throwIfAborted()
          if (err instanceof ClientUnavailableError && validationCheck) {
            reportSkipped('clientUnavailable')
            return []
          }

          const errorMessage = `${pathToString(
            context.path,
          )}: Exception occurred while validating value: ${err.message}`

          return convertToValidationMarker(
            {code: validationMarkerCodes.validationException, message: errorMessage},
            'error',
            context,
          )
        }
      }),
    )

    return results.flat()
  }
}
