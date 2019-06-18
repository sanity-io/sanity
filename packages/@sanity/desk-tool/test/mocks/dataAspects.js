module.exports = class AspectsMock {
  constructor(schema) {
    this.schema = schema
  }

  getInferredTypes() {
    return this.schema.getTypeNames()
  }

  getDocumentTypes() {
    return this.schema.getTypeNames()
  }

  getDisplayName(name) {
    return this.schema.get(name).title
  }
}
