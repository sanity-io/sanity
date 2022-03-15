import {isNonNullable} from '@sanity/base/util'
import {ListItemBuilder, StructureBuilder} from '@sanity/base/structure'
import {Schema} from '@sanity/types'

interface TypeGroupOpts {
  icon?: React.ComponentType
  id: string
  title: string
  types: string[]
  groups?: TypeGroupOpts[]
}

const TYPE_GROUP_SUPPORTED_INTENTS = ['create', 'edit']

export function _buildTypeGroup(
  S: StructureBuilder,
  schema: Schema,
  opts: TypeGroupOpts
): ListItemBuilder {
  const {groups = [], icon, id, title, types} = opts

  return S.listItem()
    .title(title)
    .icon(icon)
    .id(id)
    .child(
      S.list()
        .title(title)
        .id(id)
        .items(
          groups
            .map((g) => _buildTypeGroup(S, schema, g))
            .concat(
              types
                .map((typeName) => {
                  const schemaType = schema.get(typeName)

                  if (!schemaType) console.warn('schema type not found:', schemaType)

                  return schemaType
                })
                .filter(isNonNullable)
                .map((schemaType) => {
                  const typeName = schemaType.name

                  return S.listItem()
                    .icon(schemaType?.icon)
                    .title(schemaType?.title || typeName)
                    .id(typeName)
                    .child(
                      S.documentList()
                        .canHandleIntent((intentName, params) => {
                          return (
                            TYPE_GROUP_SUPPORTED_INTENTS.includes(intentName) &&
                            typeName === params.type
                          )
                        })
                        .id(typeName)
                        .title(schemaType.title || typeName)
                        .schemaType(typeName)
                        .filter(`_type == $type`)
                        .params({type: typeName})
                    )
                })
            )
        )
    )
}
