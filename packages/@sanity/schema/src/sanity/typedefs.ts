export interface TypeDef {
  name: string
  type: string
  title?: string
  description?: string
  options?: Record<string, any>
}

export type SchemaDef = {
  name: string
  types: Array<TypeDef>
}

export type Severity = 'warning' | 'info' | 'error'

export type ValidationResult = {
  severity: Severity
  message: string
  helpId?: string
}

export type MemberValidator = (def: TypeDef) => Array<ValidationResult>

export type TypeFactory = {
  get(): TypeFactory
  extend: (def: TypeDef) => TypeFactory
}

export type Registry = {[name: string]: TypeFactory}

export type IndexedTypes = {
  [name: string]: TypeDef
}

export type Validators = {
  [name: string]: {
    validate: (TypeDef, MemberValidator) => Array<ValidationResult>
    validateMember: (def: TypeDef) => Array<ValidationResult>
  }
}

export interface ProblemType {
  _problems: Problem[]
}

export interface Problem {}

export interface TypeWithProblems {
  path: any[]
  problems: Problem[]
}
