import JSDOMEnvironment from 'jest-environment-jsdom'

export default class JSDOMEnvironmentWithDomRange extends JSDOMEnvironment {
  public async setup(): Promise<void> {
    await super.setup()

    // Support domRange.getBoundingClientRect (not implemented by JSDOM)
    this.global.document.createRange = () => {
      const range = new Range()

      range.getBoundingClientRect = jest.fn()

      range.getClientRects = (jest.fn(() => ({
        item: () => null,
        length: 0,
      })) as unknown) as () => DOMRectList

      return range
    }
  }
}
