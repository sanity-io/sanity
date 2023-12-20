import preprocessWhitespace from './whitespace'
import preprocessHTML from './html'
import preprocessWord from './word'
import preprocessGDocs from './gdocs'
import preprocessNotion from './notion'

export default [
  preprocessWhitespace,
  preprocessNotion,
  preprocessWord,
  preprocessGDocs,
  preprocessHTML,
]
