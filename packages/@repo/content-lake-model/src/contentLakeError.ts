export interface ContentLakeErrorBody {
  type: string
  description: string
  [key: string]: unknown
}

export class ContentLakeError extends Error {
  constructor(
    readonly statusCode: number,
    readonly body: ContentLakeErrorBody,
  ) {
    super(body.description)
    this.name = 'ContentLakeError'
  }
}

export function documentNotFound(id: string): ContentLakeErrorBody {
  return {
    description: `The document with the ID "${id}" was not found`,
    id,
    type: 'documentNotFoundError',
  }
}

export function documentAlreadyExists(id: string): ContentLakeErrorBody {
  return {
    description: `Document by ID "${id}" already exists`,
    id,
    type: 'documentAlreadyExistsError',
  }
}

export function revisionMismatch(
  id: string,
  currentRevisionID: string | undefined,
  expectedRevisionID: string,
): ContentLakeErrorBody {
  return {
    currentRevisionID,
    description: `Document "${id}" has unexpected revision ID ("${currentRevisionID}"), expected "${expectedRevisionID}"`,
    expectedRevisionID,
    type: 'documentRevisionIDDoesNotMatchError',
  }
}

export function mutationFailed(
  statusCode: number,
  index: number,
  error: ContentLakeErrorBody,
): ContentLakeError {
  return new ContentLakeError(statusCode, {
    description: `Mutation failed: ${error.description}`,
    items: [{error, index}],
    type: 'mutationError',
  })
}
