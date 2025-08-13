import {isArrayOfBlocksSchemaType} from '@sanity/types'

import {type InputProps, type PortableTextInputProps} from '../../../form/types/inputProps'
import {CommentsPortableTextInput} from './components/CommentsPortableTextInput'

function isPortableTextInputProps(
  inputProps: InputProps | Omit<InputProps, 'renderDefault'>,
): inputProps is PortableTextInputProps {
  return isArrayOfBlocksSchemaType(inputProps.schemaType)
}

export function CommentsInput(props: InputProps) {
  if (isPortableTextInputProps(props)) {
    return <CommentsPortableTextInput {...props} />
  }

  return props.renderDefault(props)
}
