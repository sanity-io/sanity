import {SerializeOptions} from './StructureNodes'
import {Partial} from './Partial'
import {ListItemBuilder, ListItem, UnserializedListItem, ListItemInput} from './ListItem'
import {SchemaType} from './parts/Schema'
import {SerializeError, HELP_URL} from './SerializeError'
import {EditorBuilder} from './Editor'

export interface DocumentListItemInput extends ListItemInput {
  schemaType: SchemaType | string
}

export interface DocumentListItem extends ListItem {
  schemaType: SchemaType
  _id: string
}

type PartialDocumentListItem = Partial<UnserializedListItem>

const getDefaultChildResolver = (spec: PartialDocumentListItem) => (documentId: string) => {
  let editor = new EditorBuilder().id('editor').documentId(documentId)
  if (spec.schemaType) {
    editor = editor.schemaType(spec.schemaType)
  }

  return editor
}

export class DocumentListItemBuilder extends ListItemBuilder {
  protected spec: PartialDocumentListItem

  constructor(spec?: DocumentListItemInput) {
    super(spec)
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

  clone(withSpec?: PartialDocumentListItem) {
    const builder = new DocumentListItemBuilder()
    builder.spec = {...this.spec, ...(withSpec || {})}
    return builder
  }
}
