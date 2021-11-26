interface FormFieldValidationWarning {
  type: 'warning'
  label: string
}

interface FormFieldValidationError {
  type: 'error'
  label: string
}

interface FormFieldValidationInfo {
  type: 'info'
  label: string
}

export type FormFieldValidation =
  | FormFieldValidationWarning
  | FormFieldValidationError
  | FormFieldValidationInfo
