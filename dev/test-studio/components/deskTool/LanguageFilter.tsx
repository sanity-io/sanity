import {SchemaType} from '@sanity/types'
import {Card, Text} from '@sanity/ui'

export function LanguageFilter(props: {schemaType: SchemaType}) {
  return (
    <Card border padding={3} radius={2}>
      <div style={{margin: -1}}>
        <Text size={2}>LanguageFilter: {props.schemaType.name}</Text>
      </div>
    </Card>
  )
}
