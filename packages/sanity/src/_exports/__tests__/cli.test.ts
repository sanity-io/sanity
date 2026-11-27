import {describe, expect, it} from 'vitest'

import {defineCliConfig} from '../cli'

describe('defineCliConfig', () => {
  it('ignores a project-root _document component unless opted back in', () => {
    expect(defineCliConfig({}).unstable_documentComponent).toBe(false)
    expect(defineCliConfig({reactStrictMode: false})).toEqual({
      unstable_documentComponent: false,
      reactStrictMode: false,
    })
    expect(defineCliConfig({unstable_documentComponent: true}).unstable_documentComponent).toBe(
      true,
    )
    expect(defineCliConfig({unstable_documentComponent: false}).unstable_documentComponent).toBe(
      false,
    )
  })
})
