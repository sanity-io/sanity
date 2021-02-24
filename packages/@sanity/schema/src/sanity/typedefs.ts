interface GenericTypeDef<T extends string = string> {
  /** The field name. This will be the key in the data record. */
  name: string;
  /** Name of any valid schema type. This will be the type of the value in the data record. */
  type: T;
  /** Human readable label for the field. */
  title?: string;
  hidden?: boolean;
  description?: string;
  readOnly?: string;
  validation?: (validator: Validator<any>) => any;
}

export interface ArrayTypeDef extends GenericTypeDef<'array'> {
  of: Array<{ type: string } & Partial<TypeDef>>;
  options?: {
    sortable?: boolean;
    layout?: 'tags' | 'grid';
    list?: Array<{ value: any; title: string }>;
    editModal?: 'dialog' | 'fullscreen' | 'popover';
  };
  validation?: (validator: Validator<any>) => any;
};

export interface Validator<T = any> {
    required: () => Validator<T>;
    min: (n: number | string) => Validator<T>;
    max: (n: number | string) => Validator<T>;
    error: (m: string) => Validator<T>;
    warning: (m: string) => Validator<T>;
    valueOfField: (f: string) => any;
    custom: (fn: (arg: T) => any) => Validator<T>;
    /** All characters must be uppercase. */
    uppercase: () => Validator<T>;
};

export type TypeDef = ArrayTypeDef | GenericTypeDef;

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
