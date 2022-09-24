export interface FormFieldValidationWarning {
  type: 'warning'
  label: string
}

export interface FormFieldValidationError {
  type: 'error'
  label: string
}

export interface FormFieldValidationInfo {
  type: 'info'
  label: string
}

export type FormFieldValidation =
  | FormFieldValidationWarning
  | FormFieldValidationError
  | FormFieldValidationInfo
