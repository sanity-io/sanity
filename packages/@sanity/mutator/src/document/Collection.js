// @flow
import Document from './Document'

export default class Collection {
  documents : {[id : string] : string}
  filter : Function
  constructor() {
    this.documents = {}
    this.filter = () => true
  }
}