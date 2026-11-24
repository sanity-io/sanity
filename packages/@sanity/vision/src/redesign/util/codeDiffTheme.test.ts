import {type TagStyle} from '@codemirror/language'
import {tags as t} from '@lezer/highlight'
import {registerCustomTheme} from '@pierre/diffs'
import {preloadDiffHTML} from '@pierre/diffs/ssr'
import {beforeAll, describe, expect, it} from 'vitest'

import {codeDiffSyntaxProperties, codeDiffThemeName, createCodeDiffTheme} from './codeDiffTheme'

// Named after what each tag is in the editors' table, so the expectations read as token kinds
const SPECS: TagStyle[] = [
  {tag: [t.number], color: 'number'},
  {tag: [t.atom, t.bool, t.special(t.variableName)], color: 'atom'},
  {tag: [t.string, t.special(t.string)], color: 'string'},
  {tag: [t.null], fontStyle: 'italic'},
]

describe('codeDiffSyntaxProperties', () => {
  it('gives each token the color the editors pick for its tag', () => {
    expect(codeDiffSyntaxProperties(SPECS)).toEqual({
      '--vision-diff-syntax-string': 'string',
      '--vision-diff-syntax-number': 'number',
      '--vision-diff-syntax-boolean': 'atom',
    })
  })

  it('leaves out tokens the editors do not color, so they inherit the foreground', () => {
    expect(codeDiffSyntaxProperties([])).toEqual({})
  })
})

async function render(scheme: 'light' | 'dark') {
  return preloadDiffHTML({
    oldFile: {name: 'diff.json', contents: '{\n  "a": 1\n}\n', lang: 'json'},
    newFile: {name: 'diff.json', contents: '{\n  "a": true\n}\n', lang: 'json'},
    options: {
      disableFileHeader: true,
      theme: codeDiffThemeName(scheme),
      themeType: scheme,
    },
  })
}

describe('createCodeDiffTheme', () => {
  beforeAll(() => {
    for (const scheme of ['light', 'dark'] as const) {
      registerCustomTheme(codeDiffThemeName(scheme), () =>
        Promise.resolve(createCodeDiffTheme(scheme)),
      )
    }
  })

  it('colors JSON tokens from the properties the editors fill in', async () => {
    const html = await render('light')
    expect(html).toContain('color:var(--vision-diff-syntax-string)')
    expect(html).toContain('color:var(--vision-diff-syntax-number)')
    expect(html).toContain('color:var(--vision-diff-syntax-boolean)')
  })

  it('takes the card colors and the color scheme it is rendered in', async () => {
    const light = await render('light')
    expect(light).toContain('var(--card-bg-color)')
    expect(light).toContain('var(--card-fg-color)')
    expect(light).toMatch(/color-scheme:\s*light/)
    expect(await render('dark')).toMatch(/color-scheme:\s*dark/)
  })
})
