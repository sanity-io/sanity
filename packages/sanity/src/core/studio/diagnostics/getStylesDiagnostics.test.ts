import {afterEach, describe, expect, it} from 'vitest'

import {getStylesDiagnostics} from './getStylesDiagnostics'

const styleNodes: HTMLStyleElement[] = []

function appendStyledSheet(css: string, version?: string): HTMLStyleElement {
  const node = document.createElement('style')
  node.dataset.styled = 'active'
  if (version) node.dataset.styledVersion = version
  node.textContent = css
  document.head.appendChild(node)
  styleNodes.push(node)
  return node
}

afterEach(() => {
  for (const node of styleNodes.splice(0)) node.remove()
})

describe('getStylesDiagnostics', () => {
  it('reports no styled-components sheets when none are injected', () => {
    expect(getStylesDiagnostics()).toEqual({styledComponents: []})
  })

  it('reports rule counts, UTF-8 sizes, and versions for each styled-components sheet', () => {
    appendStyledSheet('.a{color:red}.b{color:blue}', '6.5.3')
    appendStyledSheet('.c{color:green}')

    const [first, second] = getStylesDiagnostics().styledComponents
    expect(first).toMatchObject({ruleCount: 2, version: '6.5.3'})
    expect(second).toMatchObject({ruleCount: 1, version: undefined})
    expect(first?.sizeBytes).toBeGreaterThan(0)
    expect(second?.sizeBytes).toBeGreaterThan(0)
    expect(first?.sizeBytes).toBeGreaterThan(second?.sizeBytes ?? 0)
  })

  it('counts multibyte characters as they would be encoded in a CSS file', () => {
    appendStyledSheet('.a::before{content:"e"}')
    const ascii = getStylesDiagnostics().styledComponents[0]?.sizeBytes

    for (const node of styleNodes.splice(0)) node.remove()
    appendStyledSheet('.a::before{content:"é😀"}')
    const multibyte = getStylesDiagnostics().styledComponents[0]?.sizeBytes

    expect(ascii).toBeGreaterThan(0)
    expect(multibyte).toBeGreaterThan(ascii ?? 0)
  })

  it('measures CSSOM-injected sheets whose style tags have empty innerHTML', () => {
    const node = document.createElement('style')
    node.dataset.styled = 'active'
    node.dataset.styledVersion = '6.5.3'
    document.head.appendChild(node)
    styleNodes.push(node)
    node.sheet?.insertRule('.a{color:red}')
    node.sheet?.insertRule('.b{color:blue}')

    expect(node.innerHTML).toBe('')
    const [sheet] = getStylesDiagnostics().styledComponents
    expect(sheet).toMatchObject({ruleCount: 2, version: '6.5.3'})
    expect(sheet?.sizeBytes).toBeGreaterThan(0)
  })

  it('falls back to textContent when cssRules is inaccessible', () => {
    const node = appendStyledSheet('.a{color:red}', '6.5.3')
    Object.defineProperty(node, 'sheet', {
      configurable: true,
      get() {
        return {
          get cssRules(): CSSRuleList {
            throw new DOMException('The operation is insecure.', 'SecurityError')
          },
        }
      },
    })

    expect(getStylesDiagnostics().styledComponents).toEqual([
      {ruleCount: 0, sizeBytes: 13, version: '6.5.3'},
    ])
  })
})
