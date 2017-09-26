// @flow
import importImage from './image/importImage'
import Observable from '@sanity/observable'


function readAsText(file: File) {
  return new Observable(observer => {
    const reader = new FileReader()
    reader.onerror = error => observer.error(error)
    reader.onload = () => {
      observer.next(reader.result)
      observer.complete()
    }
    reader.readAsText(file)
  })
}

export default {
  image: {
    'image/*': (file: File) => importImage(file)
      .filter(event => event.type === 'complete')
      .map(event => ({
        _type: 'image',
        asset: {_type: 'reference', _ref: event.asset._id}
      }))
  },
  file: {
    '*/*': () => ({})
  },
  string: {
    'text/plain': readAsText
  },
  book: {
    'text/plain': (file: File) => readAsText(file).map(text => ({_type: 'book', title: text})),
    'application/json': (file: File) => readAsText(file)
      .map(text => JSON.parse(text))
      .map(book => ({...book, _type: 'book'}))
  }
}
