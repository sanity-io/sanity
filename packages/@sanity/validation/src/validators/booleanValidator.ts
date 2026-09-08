import {type Validators} from '@sanity/types'

import {validationMarkerCodes} from '../codes'
import {genericValidators} from './genericValidator'

export const booleanValidators: Validators = {
  ...genericValidators,

  presence: (flag, value, message, {i18n}) => {
    if (flag === 'required' && typeof value !== 'boolean') {
      return {
        code: validationMarkerCodes.valueRequired,
        message: message || i18n.t('validation:generic.required', {context: 'boolean'}),
      }
    }

    return true
  },
}
