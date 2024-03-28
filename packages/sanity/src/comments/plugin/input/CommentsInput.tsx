import {type InputProps, isArrayOfBlocksSchemaType, type PortableTextInputProps} from 'sanity'

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
