import {SchemaType} from '@sanity/types'
import {SerializeOptions} from './StructureNodes'
import {ListItemBuilder, ListItem, UnserializedListItem, ListItemInput} from './ListItem'
import {SerializeError, HELP_URL} from './SerializeError'
import {DocumentBuilder} from './Document'
import {StructureContext} from './types'
import {isRecord} from 'sanity'

/**
 * Interface for document list item input
 *
 * @public
 */
export interface DocumentListItemInput extends ListItemInput {
  /** Document list item input schema type. See {@link SchemaType} */
  schemaType: SchemaType | string
}

/**
 * Interface for document list item
 *
 * @public
 */
export interface DocumentListItem extends ListItem {
  /** Document schema type. See {@link SchemaType} */
  schemaType: SchemaType
  /** Document ID */
  _id: string
}

/**
 * Partial document list item
 *
 * @public
 */
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

/**
 * Class for building a document list item
 *
 * @public
 */
export class DocumentListItemBuilder extends ListItemBuilder {
  /** Document list options. See {@link PartialDocumentListItem} */
  protected spec: PartialDocumentListItem

  constructor(
    /**
     * Desk structure context. See {@link StructureContext}
     */
    protected _context: StructureContext,
    spec?: DocumentListItemInput,
  ) {
    super(_context, spec)
    this.spec = spec ? spec : {}
  }

  /**
   * Serialize document list item
   * @param options - serialization options. See {@link SerializeOptions}
   * @returns document list item object based on path provided in options. See {@link DocumentListItem}
   */
  serialize(options: SerializeOptions = {path: []}): DocumentListItem {
    const spec = super.serialize({...options, titleIsOptional: true})

    if (!spec.schemaType) {
      throw new SerializeError(
        '`schemaType` is required for document list items',
        options.path,
        options.index,
      ).withHelpUrl(HELP_URL.SCHEMA_TYPE_REQUIRED)
    }

    const child = spec.child || createDefaultChildResolver(this._context, spec)
    return {...spec, child, schemaType: spec.schemaType, _id: spec.id}
  }

  /** Clone Document list item builder (allows for options overriding)
   * @param withSpec - Document list item builder options. See {@link PartialDocumentListItem}
   * @returns document list item builder. See {@link DocumentListItemBuilder}
   */
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
