import {type ObjectFieldProps, type ObjectInputProps, type SlugValue, usePerspective} from 'sanity'

export function DisableOnReleasesSlugField(props: ObjectFieldProps<SlugValue>) {
  const {selectedReleaseId} = usePerspective()
  console.log('FieldProps', props)
  return props.renderDefault({
    ...props,
    // readOnly: Boolean(selectedReleaseId),
  })
}

export function DisableOnReleasesInput(props: ObjectInputProps) {
  const {selectedReleaseId} = usePerspective()
  return props.renderDefault({
    ...props,
    readOnly: Boolean(selectedReleaseId),
  })
}
