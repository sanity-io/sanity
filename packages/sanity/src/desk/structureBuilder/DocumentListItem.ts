import {SchemaType} from '@sanity/types'
import {SerializeOptions} from './StructureNodes'
import {ListItemBuilder, ListItem, UnserializedListItem, ListItemInput} from './ListItem'
import {SerializeError, HELP_URL} from './SerializeError'
import {DocumentBuilder} from './Document'
import {StructureContext} from './types'
import {isRecord} from 'sanity'

/** @beta */
export interface DocumentListItemInput extends ListItemInput {
  schemaType: SchemaType | string
}

/** @beta */
export interface DocumentListItem extends ListItem {
  schemaType: SchemaType
  _id: string
}

/** @beta */
export type PartialDocumentListItem = Partial<UnserializedListItem>

const createDefaultChildResolver =
  (context: StructureContext, spec: PartialDocumentListItem) => (documentId: string) => {
    const schemaType =
      spec.schemaType &&
      (typeof spec.schemaType === 'string' ? spec.schemaType : spec.schemaType.name)

    return schemaType
      ? context.resolveDocumentNode({schemaType, documentId})
      : new DocumentBuilder(context).id('documentEditor').documentId(documentId)
  }

/** @beta */
export class DocumentListItemBuilder extends ListItemBuilder {
  protected spec: PartialDocumentListItem

  constructor(protected _context: StructureContext, spec?: DocumentListItemInput) {
    super(_context, spec)
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

    const child = spec.child || createDefaultChildResolver(this._context, spec)
    return {...spec, child, schemaType: spec.schemaType, _id: spec.id}
  }

  clone(withSpec?: PartialDocumentListItem): DocumentListItemBuilder {
    const builder = new DocumentListItemBuilder(this._context)
    builder.spec = {...this.spec, ...(withSpec || {})}
    return builder
  }
}

/** @internal */
export function isDocumentListItem(item: unknown): item is DocumentListItem {
  return isRecord(item) && typeof item.schemaType !== 'undefined' && typeof item._id === 'string'
}
