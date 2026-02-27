import {type SerializePath} from './StructureNodes'

/** @internal */
export class SerializeError extends Error {
  public readonly path: SerializePath
  public helpId?: (typeof HELP_URL)[keyof typeof HELP_URL]

  constructor(
    message: string,
    parentPath: SerializePath,
    pathSegment: string | number | undefined,
    hint?: string,
  ) {
    super(message)
    this.name = 'SerializeError'
    const segment = typeof pathSegment === 'undefined' ? '<unknown>' : `${pathSegment}`
    this.path = (parentPath || []).concat(hint ? `${segment} (${hint})` : segment)
  }

  withHelpUrl(id: (typeof HELP_URL)[keyof typeof HELP_URL]): SerializeError {
    this.helpId = id
    return this
  }
}

/** @internal */
export const HELP_URL = {
  ID_REQUIRED: 'structure-node-id-required' as const,
  TITLE_REQUIRED: 'structure-title-required' as const,
  FILTER_REQUIRED: 'structure-filter-required' as const,
  INVALID_LIST_ITEM: 'structure-invalid-list-item' as const,
  COMPONENT_REQUIRED: 'structure-view-component-required' as const,
  DOCUMENT_ID_REQUIRED: 'structure-document-id-required' as const,
  DOCUMENT_TYPE_REQUIRED: 'structure-document-type-required' as const,
  SCHEMA_TYPE_REQUIRED: 'structure-schema-type-required' as const,
  SCHEMA_TYPE_NOT_FOUND: 'structure-schema-type-not-found' as const,
  LIST_ITEMS_MUST_BE_ARRAY: 'structure-list-items-must-be-array' as const,
  QUERY_PROVIDED_FOR_FILTER: 'structure-query-provided-for-filter' as const,
  ACTION_OR_INTENT_REQUIRED: 'structure-action-or-intent-required' as const,
  LIST_ITEM_IDS_MUST_BE_UNIQUE: 'structure-list-item-ids-must-be-unique' as const,
  ACTION_AND_INTENT_MUTUALLY_EXCLUSIVE: 'structure-action-and-intent-mutually-exclusive' as const,
  API_VERSION_REQUIRED_FOR_CUSTOM_FILTER:
    'structure-api-version-required-for-custom-filter' as const,
}
