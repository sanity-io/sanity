import geopoint from './types/geopoint'
import Schema from '@sanity/schema'
export default schemaDef => {
  return Schema.compile({
    name: schemaDef.name,
    types: [geopoint, ...schemaDef.types]
  })
}

