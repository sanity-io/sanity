// api extractor take issues with 'as const' for literals
// eslint-disable-next-line @typescript-eslint/prefer-as-const
export const RELEASE_DOCUMENT_TYPE: 'system.release' = 'system.release'
export const RELEASE_DOCUMENTS_PATH = '_.releases'
export const PATH_SEPARATOR = '.'
export const RELEASE_DOCUMENTS_PATH_PREFIX = `${RELEASE_DOCUMENTS_PATH}${PATH_SEPARATOR}`

/** @internal */
export const DRAFTS_FOLDER = 'drafts'
/** @internal */
export const VERSION_FOLDER = 'versions'
/** @internal */
export const DRAFTS_PREFIX = `${DRAFTS_FOLDER}${PATH_SEPARATOR}`
/** @internal */
export const VERSION_PREFIX = `${VERSION_FOLDER}${PATH_SEPARATOR}`
