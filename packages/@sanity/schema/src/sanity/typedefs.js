// @flow
export type TypeDef = {
  name: string,
  type: string,
  title: ?string,
  description: ?string,
  options: ?Object
}

export type SchemaDef = {
  name: string,
  types: Array<TypeDef>
}

export type Severity = 'warning' | 'info' | 'error'

export type ValidationResult = {
  severity: Severity,
  message: string,
  helpId: ?string
}

export type MemberValidator = TypeDef => Array<ValidationResult>

export type TypeFactory = {
  get(): TypeFactory,
  extend: TypeDef => TypeFactory
}

export type Registry = {[string]: TypeFactory}

export type IndexedTypes = {
  [string]: TypeDef
}

export type Validators = {
  [string]: {
    validate: (TypeDef, MemberValidator) => Array<ValidationResult>,
    validateMember: TypeDef => Array<ValidationResult>
  }
}
