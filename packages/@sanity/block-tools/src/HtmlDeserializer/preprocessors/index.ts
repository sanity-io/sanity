import preprocessWhitespace from './whitespace'
import preprocessHTML from './html'
import preprocessWord from './word'
import preprocessGDocs from './gdocs'

export default [preprocessWhitespace, preprocessWord, preprocessGDocs, preprocessHTML]
