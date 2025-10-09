import {Inline, Stack, Text, TextInput} from '@sanity/ui'
import {type StringInputProps} from 'sanity'

interface SourceOptions {
  name?: string
  field?: string
}

export function ExternalSourceInput(props: StringInputProps) {
  const {schemaType} = props
  const options = (schemaType.options as SourceOptions) || {}
  const sourceName = options.name || 'External Source'

  return (
    <Stack space={3}>
      <Text>
        <strong>{schemaType.title}</strong>
      </Text>

      <TextInput value={'$100,000'} disabled />

      <Inline space={3}>
        <Text>
          <a
            href="#"
            style={{color: 'var(--card-link-color)', textDecoration: 'underline'}}
            onClick={(e) => e.preventDefault()}
          >
            view in {sourceName}
          </a>
        </Text>
        <Text>
          <a
            href="#"
            style={{color: 'var(--card-link-color)', textDecoration: 'underline'}}
            onClick={(e) => e.preventDefault()}
          >
            Unlink from {sourceName}
          </a>
        </Text>
      </Inline>
    </Stack>
  )
}
