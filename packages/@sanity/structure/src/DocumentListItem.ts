import {SerializeOptions} from './StructureNodes'
import {Partial} from './Partial'
import {ListItemBuilder, ListItem, UnserializedListItem, ListItemInput} from './ListItem'
import {SchemaType} from './parts/Schema'
import {SerializeError, HELP_URL} from './SerializeError'

export interface DocumentListItemInput extends ListItemInput {
  schemaType: SchemaType | string
}

export interface DocumentListItem extends ListItem {
  schemaType: SchemaType
  _id: string
}

type PartialDocumentListItem = Partial<UnserializedListItem>

export class DocumentListItemBuilder extends ListItemBuilder {
  protected spec: PartialDocumentListItem

  constructor(spec?: DocumentListItemInput) {
    super(spec)
    this.spec = spec ? spec : {}
  }

  id(id: string): DocumentListItemBuilder {
    this.spec.id = id
    return this
  }

  title(title: string): DocumentListItemBuilder {
    this.spec.title = undefined
    return this
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

    return {...spec, schemaType: spec.schemaType, _id: spec.id}
  }
}
