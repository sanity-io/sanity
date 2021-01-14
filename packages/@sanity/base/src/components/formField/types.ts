interface FormFieldValidationWarning {
  type: 'warning'
  label: string
}

interface FormFieldValidationError {
  type: 'error'
  label: string
}

export type FormFieldValidation = FormFieldValidationWarning | FormFieldValidationError
