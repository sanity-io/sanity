import {Card} from '@sanity/ui'
import {type ReactNode} from 'react'
import {
  type ArrayOfObjectsInputProps,
  type ArrayOfPrimitivesInputProps,
  type BooleanInputProps,
  type CrossDatasetReferenceInputProps,
  type DateInputProps,
  type DateTimeInputProps,
  type FileInputProps,
  type ImageInputProps,
  type NumberInputProps,
  type ObjectInputProps,
  PortableTextInput,
  type PortableTextInputProps,
  type ReferenceInputProps,
  type SlugInputProps,
  type StringInputProps,
  TextInput,
  type UrlInputProps,
} from 'sanity'
import {
  ArrayOfObjectsInput,
  ArrayOfOptionsInput,
  ArrayOfPrimitivesInput,
  BooleanInput,
  CrossDatasetReferenceInput,
  DateInput,
  DateTimeInput,
  EmailInput,
  FileInput,
  ImageInput,
  NumberInput,
  ObjectInput,
  ReferenceInput,
  SelectInput,
  SlugInput,
  StringInput,
  TagsArrayInput,
  TelephoneInput,
  UniversalArrayInput,
  UrlInput,
} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver'

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

export function DelegatedArrayOfPrimitivesInput(props: ArrayOfPrimitivesInputProps) {
  return (
    <DelegateBorder>
      <ArrayOfPrimitivesInput {...props} />
    </DelegateBorder>
  )
}

export function DelegatedArrayOfObjectsInput(props: ArrayOfObjectsInputProps) {
  return (
    <DelegateBorder>
      <ArrayOfObjectsInput {...props} />
    </DelegateBorder>
  )
}

export function DelegatedTagsArrayInput(props: ArrayOfPrimitivesInputProps) {
  // lets just live with the need to cast here
  return (
    <DelegateBorder>
      <TagsArrayInput {...(props as ArrayOfPrimitivesInputProps<string>)} />
    </DelegateBorder>
  )
}

export function DelegatedBooleanInput(props: BooleanInputProps) {
  return (
    <DelegateBorder>
      <BooleanInput {...props} />
    </DelegateBorder>
  )
}

export function DelegatedDateInput(props: DateInputProps) {
  return (
    <DelegateBorder>
      <DateInput {...props} />
    </DelegateBorder>
  )
}

export function DelegatedDatetimeInput(props: DateTimeInputProps) {
  return (
    <DelegateBorder>
      <DateTimeInput {...props} />
    </DelegateBorder>
  )
}

export function DelegatedNumberInput(props: NumberInputProps) {
  return (
    <DelegateBorder>
      <NumberInput {...props} />
    </DelegateBorder>
  )
}

export function DelegatedReferenceInput(props: ReferenceInputProps) {
  return (
    <DelegateBorder>
      <ReferenceInput {...props} />
    </DelegateBorder>
  )
}

export function DelegatedCrossDatasetReferenceInput(props: CrossDatasetReferenceInputProps) {
  return (
    <DelegateBorder>
      <CrossDatasetReferenceInput {...props} />
    </DelegateBorder>
  )
}

export function DelegatedFileInput(props: FileInputProps) {
  return (
    <DelegateBorder>
      <FileInput {...props} />
    </DelegateBorder>
  )
}

export function DelegatedSlugInput(props: SlugInputProps) {
  return (
    <DelegateBorder>
      <SlugInput {...props} />
    </DelegateBorder>
  )
}

export function DelegatedImageInput(props: ImageInputProps) {
  return (
    <DelegateBorder>
      <ImageInput {...props} />
    </DelegateBorder>
  )
}

export function DelegatedObjectInput(props: ObjectInputProps) {
  return (
    <DelegateBorder>
      <ObjectInput {...props} />
    </DelegateBorder>
  )
}

export function DelegatedStringInput(props: StringInputProps) {
  return (
    <DelegateBorder>
      <StringInput {...props} />
    </DelegateBorder>
  )
}

export function DelegatedTextInput(props: StringInputProps) {
  return (
    <DelegateBorder>
      <TextInput {...props} />
    </DelegateBorder>
  )
}

export function DelegatedTelephoneInput(props: StringInputProps) {
  return (
    <DelegateBorder>
      <TelephoneInput {...props} />
    </DelegateBorder>
  )
}

export function DelegatedEmailInput(props: StringInputProps) {
  return (
    <DelegateBorder>
      <EmailInput {...props} />
    </DelegateBorder>
  )
}

export function DelegatedSelectInput(props: StringInputProps) {
  return (
    <DelegateBorder>
      <SelectInput {...props} />
    </DelegateBorder>
  )
}

export function DelegatedUrlInput(props: UrlInputProps) {
  return (
    <DelegateBorder>
      <UrlInput {...props} />
    </DelegateBorder>
  )
}

export function DelegatedPTEInput(props: ArrayOfObjectsInputProps) {
  // lets just live with the need to cast here
  return (
    <DelegateBorder>
      <PortableTextInput {...(props as unknown as PortableTextInputProps)} />
    </DelegateBorder>
  )
}
