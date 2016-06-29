import toProseMirror from './conversion/toProseMirror'
import fromProseMirror from './conversion/fromProseMirror'


export default class ProseMirrorValueContainer {
  static deserialize(value, context) {

    const jsonValue = value ? toProseMirror(value, context) : {type: 'doc', content: [
      {type: 'paragraph', content: []}
    ]}

    return new ProseMirrorValueContainer({jsonValue}, context)
  }

  constructor({jsonValue, pm}, context) {
    this.jsonValue = jsonValue
    this.pm = pm
    this.context = context
  }

  validate() {

  }

  // ugly bugly
  attachPM(pm) {
    if (this.pm) {
      throw new Error('Prosemirror instance can only be attached once')
    }
    this.pm = pm
  }

  patch(patch) {
    if (!patch.hasOwnProperty('$doc')) {
      throw new Error('The document must be supplied with the patch')
    }
    return new ProseMirrorValueContainer({doc: patch.$doc, pm: this.pm}, this.context)
  }

  serialize() {
    const doc = this.pm ? this.pm.doc : this.doc
    return doc ? fromProseMirror(doc.toJSON()) : this.jsonValue
  }
}
