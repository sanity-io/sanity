import {genericValidators} from './genericValidator'
import {type Validators} from '@sanity/types'

export const booleanValidators: Validators = {
  ...genericValidators,

  presence: (flag, value, message, {i18n}) => {
    if (flag === 'required' && typeof value !== 'boolean') {
      return message || i18n.t('validation:generic.required', {context: 'boolean'})
    }

    return true
  },
}
