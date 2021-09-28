import {getNewDocumentModalActions} from './util/getNewDocumentModalActions'

export const NEW_DOCUMENT_ACTIONS = getNewDocumentModalActions()
export const NEW_DOCUMENT_TYPES = NEW_DOCUMENT_ACTIONS.map((action) => action.schemaType)
