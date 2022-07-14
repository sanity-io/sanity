import React from 'react'
import {SchemaType} from '@sanity/types'
import {SemiboldSpan} from './SemiboldSpan'

function typeTitle(schemaType: SchemaType) {
  return schemaType.title ?? schemaType.name
}

export function TypeNames({prefix, types}: {prefix?: string; types: SchemaType[]}) {
  if (!types.length) {
    return null
  }
  if (types.length === 1) {
    return (
      <>
        {prefix && `${prefix} `}
        <SemiboldSpan>{typeTitle(types[0])}</SemiboldSpan>
      </>
    )
  }
  return (
    <>
      {prefix && `${prefix} `}
      {types.map((schemaType, i) => {
        const title = typeTitle(schemaType)
        const element = <SemiboldSpan key={title}>{title}</SemiboldSpan>
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
