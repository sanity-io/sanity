/**
 * This represents the shape of the root value sanity forms expect
 * @hidden
 * @public
 */
export interface FormDocumentValue {
  _type: string
  _id: string
  [key: string]: unknown
}
