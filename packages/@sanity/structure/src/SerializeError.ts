import {SerializePath} from './StructureNodes'

export class SerializeError extends Error {
  public readonly path: SerializePath
  public helpId?: HELP_URL

  constructor(
    message: string,
    parentPath: SerializePath,
    pathSegment: string | number | undefined,
    hint?: string
  ) {
    super(message)
    const segment = typeof pathSegment === 'undefined' ? '<unknown>' : `${pathSegment}`
    this.path = parentPath.concat(hint ? `${segment} (${hint})` : segment)
  }

  withHelpUrl(id: HELP_URL): SerializeError {
    this.helpId = id
    return this
  }
}

export enum HELP_URL {
  ID_REQUIRED = 'structure-node-id-required',
  TITLE_REQUIRED = 'structure-title-requried',
  FILTER_REQUIRED = 'structure-filter-required',
  DOCUMENT_ID_REQUIRED = 'structure-document-id-required',
  SCHEMA_TYPE_REQUIRED = 'structure-schema-type-required',
  SCHEMA_TYPE_NOT_FOUND = 'structure-schema-type-not-found',
  DOCUMENT_TYPE_REQUIRED = 'structure-document-type-required',
  QUERY_PROVIDED_FOR_FILTER = 'structure-query-provided-for-filter',
  ACTION_OR_INTENT_REQUIRED = 'structure-action-or-intent-required',
  ACTION_AND_INTENT_MUTUALLY_EXCLUSIVE = 'structure-action-and-intent-mutually-exclusive'
}
