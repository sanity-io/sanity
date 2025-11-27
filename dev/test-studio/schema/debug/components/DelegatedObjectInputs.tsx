import {Card} from '@sanity/ui'
import {type ReactNode} from 'react'
import {
  ArrayOfObjectsInput,
  type ArrayOfObjectsInputProps,
  ArrayOfOptionsInput,
  ArrayOfPrimitivesInput,
  type ArrayOfPrimitivesInputProps,
  BooleanInput,
  type BooleanInputProps,
  CrossDatasetReferenceInput,
  type CrossDatasetReferenceInputProps,
  DateInput,
  type DateInputProps,
  DateTimeInput,
  type DateTimeInputProps,
  EmailInput,
  FileInput,
  type FileInputProps,
  ImageInput,
  type ImageInputProps,
  NumberInput,
  type NumberInputProps,
  ObjectInput,
  type ObjectInputProps,
  PortableTextInput,
  type PortableTextInputProps,
  ReferenceInput,
  type ReferenceInputProps,
  SelectInput,
  SlugInput,
  type SlugInputProps,
  StringInput,
  type StringInputProps,
  TagsArrayInput,
  TelephoneInput,
  TextInput,
  UniversalArrayInput,
  UrlInput,
  type UrlInputProps,
} from 'sanity'

/* These ensure that all the native inputs are exported and assignable to defineField.components.input*/
function DelegateBorder({children}: {children?: ReactNode | undefined}) {
  return (
    <Card padding={2} style={{border: '1px dashed grey'}}>
      {children}
    </Card>
  )
}

export function DelegatedUniversalArrayInput(
  props: ArrayOfObjectsInputProps | ArrayOfPrimitivesInputProps,
) {
  return (
    <DelegateBorder>
      <UniversalArrayInput {...props} />
    </DelegateBorder>
  )
}

export function DelegatedArrayOfOptionsInput(
  props: ArrayOfObjectsInputProps | ArrayOfPrimitivesInputProps,
) {
  return (
    <DelegateBorder>
      <ArrayOfOptionsInput {...props} />
    </DelegateBorder>
  )
}

export function DelegatedArrayOfPrimitivesInput(props: ArrayOfPrimitivesInputProps) : React.JSX.Element {
  return (
    <DelegateBorder>
      <ArrayOfPrimitivesInput {...props} />
    </DelegateBorder>
  )
}

export function DelegatedArrayOfObjectsInput(props: ArrayOfObjectsInputProps) : React.JSX.Element {
  return (
    <DelegateBorder>
      <ArrayOfObjectsInput {...props} />
    </DelegateBorder>
  )
}

export function DelegatedTagsArrayInput(props: ArrayOfPrimitivesInputProps) : React.JSX.Element {
  // lets just live with the need to cast here
  return (
    <DelegateBorder>
      <TagsArrayInput {...(props as ArrayOfPrimitivesInputProps<string>)} />
    </DelegateBorder>
  )
}

export function DelegatedBooleanInput(props: BooleanInputProps) : React.JSX.Element {
  return (
    <DelegateBorder>
      <BooleanInput {...props} />
    </DelegateBorder>
  )
}

export function DelegatedDateInput(props: DateInputProps) : React.JSX.Element {
  return (
    <DelegateBorder>
      <DateInput {...props} />
    </DelegateBorder>
  )
}

export function DelegatedDatetimeInput(props: DateTimeInputProps) : React.JSX.Element {
  return (
    <DelegateBorder>
      <DateTimeInput {...props} />
    </DelegateBorder>
  )
}

export function DelegatedNumberInput(props: NumberInputProps) : React.JSX.Element {
  return (
    <DelegateBorder>
      <NumberInput {...props} />
    </DelegateBorder>
  )
}

export function DelegatedReferenceInput(props: ReferenceInputProps) : React.JSX.Element {
  return (
    <DelegateBorder>
      <ReferenceInput {...props} />
    </DelegateBorder>
  )
}

export function DelegatedCrossDatasetReferenceInput(props: CrossDatasetReferenceInputProps) : React.JSX.Element {
  return (
    <DelegateBorder>
      <CrossDatasetReferenceInput {...props} />
    </DelegateBorder>
  )
}

export function DelegatedFileInput(props: FileInputProps) : React.JSX.Element {
  return (
    <DelegateBorder>
      <FileInput {...props} />
    </DelegateBorder>
  )
}

export function DelegatedSlugInput(props: SlugInputProps) : React.JSX.Element {
  return (
    <DelegateBorder>
      <SlugInput {...props} />
    </DelegateBorder>
  )
}

export function DelegatedImageInput(props: ImageInputProps) : React.JSX.Element {
  return (
    <DelegateBorder>
      <ImageInput {...props} />
    </DelegateBorder>
  )
}

export function DelegatedObjectInput(props: ObjectInputProps) : React.JSX.Element {
  return (
    <DelegateBorder>
      <ObjectInput {...props} />
    </DelegateBorder>
  )
}

export function DelegatedStringInput(props: StringInputProps) : React.JSX.Element {
  return (
    <DelegateBorder>
      <StringInput {...props} />
    </DelegateBorder>
  )
}

export function DelegatedTextInput(props: StringInputProps) : React.JSX.Element {
  return (
    <DelegateBorder>
      <TextInput {...props} />
    </DelegateBorder>
  )
}

export function DelegatedTelephoneInput(props: StringInputProps) : React.JSX.Element {
  return (
    <DelegateBorder>
      <TelephoneInput {...props} />
    </DelegateBorder>
  )
}

export function DelegatedEmailInput(props: StringInputProps) : React.JSX.Element {
  return (
    <DelegateBorder>
      <EmailInput {...props} />
    </DelegateBorder>
  )
}

export function DelegatedSelectInput(props: StringInputProps) : React.JSX.Element {
  return (
    <DelegateBorder>
      <SelectInput {...props} />
    </DelegateBorder>
  )
}

export function DelegatedUrlInput(props: UrlInputProps) : React.JSX.Element {
  return (
    <DelegateBorder>
      <UrlInput {...props} />
    </DelegateBorder>
  )
}

export function DelegatedPTEInput(props: ArrayOfObjectsInputProps) : React.JSX.Element {
  // lets just live with the need to cast here
  return (
    <DelegateBorder>
      <PortableTextInput {...(props as unknown as PortableTextInputProps)} />
    </DelegateBorder>
  )
}
