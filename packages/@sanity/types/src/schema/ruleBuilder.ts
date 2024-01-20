import {
  type CustomValidator,
  type FieldReference,
  type LocalizedValidationMessages,
} from '../validation'

/** @public */
export interface RuleDef<T, FieldValue = unknown> {
  required: () => T

  // this generic allows callees to provide a type override
  custom: <LenientFieldValue extends FieldValue>(
    fn: CustomValidator<LenientFieldValue | undefined>,
  ) => T

  info: (message?: string | LocalizedValidationMessages) => T
  error: (message?: string | LocalizedValidationMessages) => T
  warning: (message?: string | LocalizedValidationMessages) => T
  valueOfField: (path: string | string[]) => FieldReference
}

/** @public */
export type RuleBuilder<T extends RuleDef<T, FieldValue>, FieldValue = unknown> = T | T[]

/** @public */
export type ValidationBuilder<T extends RuleDef<T, FieldValue>, FieldValue = unknown> = (
  rule: T,
) => RuleBuilder<T, FieldValue>
