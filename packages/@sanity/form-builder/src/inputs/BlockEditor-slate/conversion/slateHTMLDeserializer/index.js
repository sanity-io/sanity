import * as rules from './rules'
import {Html} from 'slate'

class HtmlDeserializer {

  constructor(options = {}) {
    this.rules = rules.createRules(options)
  }

  deserialize(html) {
    const deserializer = new Html({
      rules: this.rules,
      defaultBlockType: this.rules.defaultBlockType
    })
    return deserializer.deserialize(html)
  }
}

export default HtmlDeserializer
