import {Validators} from '@sanity/types'
import genericValidator from './genericValidator'

const booleanValidators: Validators = {
  ...genericValidator,

  presence: (flag, value, message) => {
    if (flag === 'required' && typeof value !== 'boolean') {
      return message || 'Required'
    }

    return true
  },
}

export default booleanValidators
