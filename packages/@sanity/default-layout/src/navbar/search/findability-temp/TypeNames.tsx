import React from 'react'
import {SchemaType} from '@sanity/types'

function typeTitle(schemaType: SchemaType) {
  return schemaType.title ?? schemaType.name
}

export function TypeNames({types}: {types: SchemaType[]}) {
  if (!types.length) {
    return <>all document types</>
  }
  if (types.length === 1) {
    return <strong>{typeTitle(types[0])}</strong>
  }
  return (
    <>
      {types.map((schemaType, i) => {
        const title = typeTitle(schemaType)
        const element = <strong key={title}>{title}</strong>
        if (i < types.length - 2) {
          return <React.Fragment key={title}>{element}, </React.Fragment>
        } else if (i === types.length - 1) {
          return <React.Fragment key={title}> and {element}</React.Fragment>
        }
        return element
      })}
    </>
  )
}
