import protein from '../components/ProteinInput/schema'
import author from './author'
import blogpost from './blogpost'
import videoEmbed from './videoEmbed'
import localeString from './localeString'
import localeSlug from './localeSlug'
import proteinTest from './proteinTest'
import customObject from './customObject'
import localeBlockContent from './localeBlockContent'
import {blockContent} from './blockContent'
import customBlockEditor from './customBlockEditor'

export const schemaTypes = [
  blogpost,
  author,
  customObject,
  localeString,
  localeBlockContent,
  localeSlug,
  videoEmbed,
  proteinTest,
  protein,
  blockContent,
  customBlockEditor,
]
