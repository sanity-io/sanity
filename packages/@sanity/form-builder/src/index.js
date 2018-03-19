export {default as FormBuilder} from './FormBuilder'
export {default as FormBuilderContext} from './FormBuilderContext'
export {default as BlockEditor} from './inputs/BlockEditor'
export {default as ReferenceInput} from './inputs/ReferenceInput'
export {default as FileInput} from './inputs/FileInput'
export {default as ImageInput} from './inputs/ImageInput'

export function createFormBuilder() {
  throw new Error(
    'The factory function createFormBuilder(...) has been removed. Please use <FormBuilder .../> instead'
  )
}
