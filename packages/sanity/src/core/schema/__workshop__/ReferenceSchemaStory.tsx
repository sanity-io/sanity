import {SchemaType} from '@sanity/types'
import {Box, Card, Code, Flex, Text} from '@sanity/ui'
import React, {useMemo} from 'react'
import {createSchema} from '../createSchema'

export default function ReferenceSchemaStory() {
  const authorTypeDef = useMemo(
    () => ({
      type: 'document',
      name: 'author',
      title: 'Author',
      fields: [{type: 'string', name: 'name'}],
    }),
    [],
  )

  const testTypeDef = useMemo(
    () => ({
      type: 'reference',
      name: 'test',
      title: 'Test',
      to: [{type: 'author'}],
    }),
    [],
  )

  const schemaDef = useMemo(
    () => ({name: 'test', types: [authorTypeDef, testTypeDef]}),
    [authorTypeDef, testTypeDef],
  )

  const schema = useMemo(() => createSchema(schemaDef), [schemaDef])

  return (
    <Card height="fill">
      <Flex height="fill">
        <Card flex={1} overflow="auto" padding={4}>
          <Text muted size={1} weight="medium">
            Schema definitions
          </Text>

          <Box paddingTop={4} />

          <Code language="json" size={1}>
            {JSON.stringify(schemaDef.types, null, 2)}
          </Code>
        </Card>
        <Card borderLeft flex={1} overflow="auto" padding={4}>
          <Text muted size={1} weight="medium">
            Schema types
          </Text>

          <Box paddingTop={4} />

          <Code language="json" size={1}>
            {JSON.stringify(
              [schemaTypeToJSON(schema.get('author')), schemaTypeToJSON(schema.get('test'))],
              null,
              2,
            )}
          </Code>
        </Card>
      </Flex>
    </Card>
  )
}

function schemaTypeToJSON(schemaType?: SchemaType): any {
  if (!schemaType) {
    return null
  }

  if (!schemaType.type) {
    return {name: schemaType.name}
    // return schemaType.name
  }

  const obj: any = {
    type: schemaTypeToJSON(schemaType.type),
    name: schemaType.name,
    title: schemaType.title,
  }

  if ('fields' in schemaType) {
    obj.fields = schemaType.fields.map((f) => schemaTypeToJSON(f as any))
  }

  if ('to' in schemaType) {
    obj.to = schemaType.to.map((f) => schemaTypeToJSON(f as any))
  }

  return obj
}
