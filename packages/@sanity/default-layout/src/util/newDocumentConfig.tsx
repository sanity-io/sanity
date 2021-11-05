import {getNewDocumentOptions, NewDocumentOption} from '@sanity/base/_internal'

let cached: {newDocumentOptions: NewDocumentOption[]; schemaTypes: string[]} | undefined

const calculateDocumentOptions = () => {
  if (cached) return cached
  const newDocumentOptions = getNewDocumentOptions()
  const schemaTypes = newDocumentOptions.map(({template}) => template.schemaType)

  cached = {newDocumentOptions, schemaTypes}
  return cached
}

export const newDocumentConfig = {
  get newDocumentOptions() {
    return calculateDocumentOptions().newDocumentOptions
  },
  get schemaTypes() {
    return calculateDocumentOptions().schemaTypes
  },
}
