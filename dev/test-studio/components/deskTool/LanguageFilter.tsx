import {type SchemaType} from '@sanity/types'
import {Card} from '@sanity/ui'
import {Text} from 'ui5'

export function LanguageFilter(props: {schemaType: SchemaType}) {
  return (
    <Card border padding={3} radius={2}>
      <div style={{margin: -1}}>
        <Text size={2} as="div" trim={true}>
          LanguageFilter: {props.schemaType.name}
        </Text>
      </div>
    </Card>
  )
}
