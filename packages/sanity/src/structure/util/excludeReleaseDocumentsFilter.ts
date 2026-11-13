import {getReleaseDocumentIdFromReleaseId} from 'sanity'

export const EXCLUDE_RELEASE_DOCUMENTS_FILTER = `!(_id in path("${getReleaseDocumentIdFromReleaseId('*')}"))`
