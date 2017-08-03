// @flow
import handlers from '../../import/handlers'
import Observable from '@sanity/observable'

export default function importFile(file: File) {
  return (file.type in handlers) ? handlers[file.type](file) : Observable.from({_file: file})
}
