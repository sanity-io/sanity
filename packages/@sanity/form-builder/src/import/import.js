// @flow
import handlers from './handlers'
import Observable from '@sanity/observable'

export default function importData(file: File) {
  return (file.type in handlers) ? handlers[file.type](file) : Observable.of({_file: file})
}
