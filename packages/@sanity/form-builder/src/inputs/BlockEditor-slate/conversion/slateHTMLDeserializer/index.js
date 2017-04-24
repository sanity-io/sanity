import * as rules from './rules'
import * as helpers from './helpers'
import {Html} from 'slate'

class HtmlDeserializer {

  constructor(options = {}) {
    this.rules = rules.createRules(options)
  }

  deserialize(html) {
    const cleanedHtml = helpers.cleanupHtml(html)
    const deserializer = new Html({
      rules: this.rules,
      defaultBlockType: this.rules.defaultBlockType
    })
    return deserializer.deserialize(cleanedHtml)
  }
}

export default HtmlDeserializer
