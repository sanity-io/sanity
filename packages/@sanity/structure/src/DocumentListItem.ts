import {Schema, SchemaType} from '@sanity/types'
import {SerializeOptions} from './StructureNodes'
import {ListItemBuilder, ListItem, UnserializedListItem, ListItemInput} from './ListItem'
import {SerializeError, HELP_URL} from './SerializeError'
import {DocumentBuilder, getDefaultDocumentNode} from './Document'
import {ChildResolver} from './ChildResolver'

export interface DocumentListItemInput extends ListItemInput {
  schemaType: SchemaType | string
}

export interface DocumentListItem extends ListItem {
  schemaType: SchemaType
  _id: string
}

type PartialDocumentListItem = Partial<UnserializedListItem>

const getDefaultChildResolver =
  (spec: PartialDocumentListItem): ChildResolver =>
  (context, documentId) => {
    const schemaType =
      spec.schemaType &&
      (typeof spec.schemaType === 'string' ? spec.schemaType : spec.schemaType.name)

    return schemaType
      ? getDefaultDocumentNode(context, {
          schemaType,
          documentId,
        })
      : new DocumentBuilder().id('documentEditor').documentId(documentId)
  }

export class DocumentListItemBuilder extends ListItemBuilder {
  protected spec: PartialDocumentListItem

  constructor(schema: Schema, spec?: DocumentListItemInput) {
    super(schema, spec)
    this.spec = spec ? spec : {}
  }

  serialize(options: SerializeOptions = {path: []}): DocumentListItem {
    const spec = super.serialize({...options, titleIsOptional: true})

    if (!spec.schemaType) {
      throw new SerializeError(
        '`schemaType` is required for document list items',
        options.path,
        options.index
      ).withHelpUrl(HELP_URL.SCHEMA_TYPE_REQUIRED)
    }

    const child = spec.child || getDefaultChildResolver(spec)
    return {...spec, child, schemaType: spec.schemaType, _id: spec.id}
  }

  clone(withSpec?: PartialDocumentListItem): DocumentListItemBuilder {
    const builder = new DocumentListItemBuilder(this.schema)
    builder.spec = {...this.spec, ...(withSpec || {})}
    return builder
  }
}

export function isDocumentListItem(item: unknown): item is DocumentListItem {
  const listItem = item as DocumentListItem
  return typeof listItem.schemaType !== 'undefined' && typeof listItem._id === 'string'
}
