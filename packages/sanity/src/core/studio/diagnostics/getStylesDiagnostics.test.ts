import {afterEach, describe, expect, it} from 'vitest'

import {getStylesDiagnostics} from './getStylesDiagnostics'

const styleNodes: HTMLStyleElement[] = []

function appendStyledSheet(css: string, version?: string): void {
  const node = document.createElement('style')
  node.dataset.styled = 'active'
  if (version) node.dataset.styledVersion = version
  node.textContent = css
  document.head.appendChild(node)
  styleNodes.push(node)
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

    expect(getStylesDiagnostics().styledComponents).toEqual([
      {ruleCount: 2, sizeBytes: 27, version: '6.5.3'},
      {ruleCount: 1, sizeBytes: 15, version: undefined},
    ])
  })

  it('counts multibyte characters as they would be encoded in a CSS file', () => {
    appendStyledSheet('.a::before{content:"é😀"}')

    expect(getStylesDiagnostics().styledComponents[0]?.sizeBytes).toBe(28)
  })

  it('measures CSSOM-injected rules when the style element markup is empty', () => {
    const node = document.createElement('style')
    node.dataset.styled = 'active'
    document.head.appendChild(node)
    styleNodes.push(node)
    node.sheet?.insertRule('.a{color:red}', 0)
    node.sheet?.insertRule('.b{color:blue}', 1)

    expect(node.innerHTML).toBe('')
    const cssText = Array.from(node.sheet?.cssRules ?? [], (rule) => rule.cssText).join('')
    expect(cssText.length).toBeGreaterThan(0)
    expect(getStylesDiagnostics().styledComponents).toEqual([
      {
        ruleCount: 2,
        sizeBytes: new TextEncoder().encode(cssText).byteLength,
        version: undefined,
      },
    ])
  })
})
