import * as rules from './rules'
import * as helpers from './helpers'
import {SLATE_DEFAULT_BLOCK} from '../../constants'
import Html from 'slate-html-serializer'

class HtmlDeserializer {

  constructor(options = {}) {
    this.rules = rules.createRules(options)
  }

  deserialize(html) {
    const cleanedHtml = helpers.cleanHtml(html)
    const deserializer = new Html({
      rules: this.rules,
      defaultBlock: SLATE_DEFAULT_BLOCK
    })
    return deserializer.deserialize(cleanedHtml)
  }
}

export default HtmlDeserializer
