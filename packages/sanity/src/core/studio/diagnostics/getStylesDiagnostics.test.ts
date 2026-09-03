import {version as styledComponentsVersion} from 'styled-components'
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
  it('reports the bundled styled-components version and no nodes when none are injected', () => {
    expect(getStylesDiagnostics()).toEqual({
      styledComponents: {styleNodes: [], version: styledComponentsVersion},
    })
  })

  it('reports rule counts and versions for each styled-components style node', () => {
    appendStyledSheet('.a{color:red}.b{color:blue}', '6.5.3')
    appendStyledSheet('.c{color:green}')

    expect(getStylesDiagnostics().styledComponents.styleNodes).toEqual([
      {ruleCount: 2, version: '6.5.3'},
      {ruleCount: 1, version: undefined},
    ])
  })

  it('counts zero rules for a sheet whose rules cannot be read', () => {
    appendStyledSheet('.a{color:red}', '6.5.3')
    Object.defineProperty(styleNodes[0], 'sheet', {
      get: () => ({
        get cssRules(): CSSRuleList {
          throw new DOMException('Cannot access rules', 'SecurityError')
        },
      }),
    })

    expect(getStylesDiagnostics().styledComponents.styleNodes).toEqual([
      {ruleCount: 0, version: '6.5.3'},
    ])
  })
})
