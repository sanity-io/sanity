import ValidationError from '../ValidationError'
import genericValidator from './genericValidator'

const presence = (flag, value, message) => {
  if (flag === 'required' && typeof value !== 'boolean') {
    return new ValidationError(message || 'Required')
  }

  return true
}

export default Object.assign({}, genericValidator, {
  presence,
})
