import type {Validators} from '@sanity/types'
import {genericValidators} from './genericValidator'

export const booleanValidators: Validators = {
  ...genericValidators,

  presence: (flag, value, message) => {
    if (flag === 'required' && typeof value !== 'boolean') {
      return message || 'Required'
    }

    return true
  },
}
