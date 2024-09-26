import JSDOMEnvironment from 'jest-environment-jsdom'

export default class JSDOMEnvironmentWithDomRange extends JSDOMEnvironment {
  public async setup(): Promise<void> {
    await super.setup()
    if (typeof this.global.TextEncoder === 'undefined') {
      const {TextEncoder, TextDecoder} = require('node:util')
      this.global.TextEncoder = TextEncoder
      this.global.TextDecoder = TextDecoder
    }
  }
}
