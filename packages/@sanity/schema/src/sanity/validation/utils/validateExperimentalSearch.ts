import {isPlainObject} from 'lodash'

export const validateExperimentalSearch = (configs): string[] => {
  if (!Array.isArray(configs)) {
    return ['The search config of a document type must be an array of search config objects']
  }
  return configs
    .map((conf) => {
      if (!isPlainObject(conf)) {
        return 'Search config must be an object of {path: string, weight: number}'
      }
      return null
    })
    .filter(Boolean)
}
