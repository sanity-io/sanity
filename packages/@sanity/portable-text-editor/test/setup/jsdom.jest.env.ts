import JSDOMEnvironment from 'jest-environment-jsdom'

export default class JSDOMEnvironmentWithDomRange extends JSDOMEnvironment {
  public async setup(): Promise<void> {
    await super.setup()

    // Support domRange.getBoundingClientRect (not implemented by JSDOM)
    this.global.document.createRange = () => {
      const range = new this.global.window.Range()

      range.getBoundingClientRect = () => ({
        height: 0,
        width: 0,
        x: 0,
        y: 0,
        top: 0,
        bottom: 0,
        right: 0,
        left: 0,
        toJSON: () => '',
      })

      range.getClientRects = (() =>
        ({
          item: () => null,
          length: 0,
        }) as unknown) as () => DOMRectList

      return range
    }
  }
}
