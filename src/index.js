import * as defaultInputs from './defaultInputComponents'
import * as defaultFields from './defaultFieldComponents'
import * as ReferenceInput from './inputs/Reference'

export {defaultInputs}
export {defaultFields}

export {default as Schema} from './Schema'
export {default as defaultConfig} from './defaultConfig'
export {default as createFormBuilder} from './createFormBuilder'

// Input component factories
export {ReferenceInput}

export const createReferenceInput = function deprecated(...args) {
  // eslint-disable-next-line no-console
  console.warn(
      '[deprecated] FormBuilder.createReferenceInput is deprecated, use either '
    + 'FormBuilder.ReferenceInput.createAutoComplete or FormBuilder.ReferenceInput.createBrowser(...)'
  )
  return ReferenceInput.createAutoComplete(...args)
}
