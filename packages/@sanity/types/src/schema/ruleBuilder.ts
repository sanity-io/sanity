import type {CustomValidator, FieldReference} from '../validation'

export interface RuleDef<T, FieldValue = unknown> {
  required: () => T

  // this generic allows callees to provide a type override
  custom: <LenientFieldValue extends FieldValue>(
    fn: CustomValidator<LenientFieldValue | undefined>
  ) => T

  error: (message?: string) => T
  warning: (message?: string) => T
  valueOfField: (path: string | string[]) => FieldReference
}

export type RuleBuilder<T extends RuleDef<T, FieldValue>, FieldValue = unknown> = T | T[]

export type ValidationBuilder<T extends RuleDef<T, FieldValue>, FieldValue = unknown> = (
  rule: T
) => RuleBuilder<T, FieldValue>
