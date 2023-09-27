/**
 * Represents an error thrown when the document context value is missing or not
 * found.This error typically indicates that a component is not wrapped in a
 * `<DocumentProvider />`.
 */
export class DocumentContextError extends Error {
  constructor() {
    super('Could not find context value. Did you wrap this component in a <DocumentProvider />?')
  }
}
