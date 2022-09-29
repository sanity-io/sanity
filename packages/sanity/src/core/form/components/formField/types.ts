/** @internal */
export interface FormFieldValidationWarning {
  type: 'warning'
  label: string
}

/** @internal */
export interface FormFieldValidationError {
  type: 'error'
  label: string
}

/** @internal */
export interface FormFieldValidationInfo {
  type: 'info'
  label: string
}

/** @internal */
export type FormFieldValidation =
  | FormFieldValidationWarning
  | FormFieldValidationError
  | FormFieldValidationInfo
