import Schema from '@sanity/schema'
import type {Schema as SchemaSchema} from '@sanity/types'
import {keyBy, mapValues} from 'lodash'
import getSimpleDummySchema from './schema/simpleDummySchema'
import getSimpleFieldGroupSchema from './schema/simpleFieldGroupSchema'

export const DUMMY_DOCUMENT_ID = '10053a07-8647-4ebd-9d1d-33a512d30d3a'

interface SchemaMapType {
  name: string
  title?: string
  schema: (props: WorkshopSchemaProps) => unknown
}

type SchemaKey = typeof schemaMap[number]['name']

export interface WorkshopSchemaProps {
  schemaKey?: SchemaKey
  hiddenGroup?: boolean
}

export function wrapSchema(schema: unknown) {
  return {
    name: 'test',
    types: [schema],
  }
}

const schemaMap: Readonly<SchemaMapType[]> = [
  {
    name: 'simple',
    title: 'Simple',
    schema: getSimpleDummySchema,
  },
  {
    name: 'simpleFieldGroup',
    title: 'Simple w/ Field Group',
    schema: getSimpleFieldGroupSchema,
  },
] as const

export const schemaListOptions = mapValues(keyBy(schemaMap, 'title'), 'name')

export function getDummyDocument() {
  return {
    _createdAt: '2021-11-04T15:41:48Z',
    _id: DUMMY_DOCUMENT_ID,
    _rev: '5hb8s6-k75-ip4-4bq-5ztbf3fbx',
    _type: 'book',
    _updatedAt: '2021-11-05T12:34:29Z',
    title: 'Hello world',
    person: {
      name: 'Fred',
    },
  }
}

export function getDummySchema(props: WorkshopSchemaProps): SchemaSchema {
  const {schemaKey = 'simple'} = props
  const schemaType = schemaMap.find((s) => s.name === schemaKey)
  const schema = schemaType?.schema(props)

  return Schema.compile(schema)
}
