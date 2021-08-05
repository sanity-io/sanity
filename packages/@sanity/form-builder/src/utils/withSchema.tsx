import React, {forwardRef, useContext} from 'react'
import {Schema} from '@sanity/types'
import {SchemaContext} from '../contexts/schema'

export interface WithSchemaProps {
  schema: Schema
}

export function withSchema<T extends WithSchemaProps = WithSchemaProps>(
  ComposedComponent: React.ComponentType<T>
) {
  const Composed = forwardRef(function WithSchema(props: Omit<T, 'schema'>, ref) {
    const schema = useContext(SchemaContext)

    return <ComposedComponent ref={ref} schema={schema} {...(props as T)} />
  })
  Composed.displayName = `withSchema(${ComposedComponent.displayName || ComposedComponent.name})`
  return Composed
}
