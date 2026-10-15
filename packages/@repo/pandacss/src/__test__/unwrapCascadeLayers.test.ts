import {describe, expect, it} from 'vitest'

import {unwrapCascadeLayers} from '../unwrapCascadeLayers.ts'

describe('unwrapCascadeLayers()', () => {
  it('drops the layer order declaration', () => {
    expect(unwrapCascadeLayers('@layer reset, base, tokens, recipes, utilities;\n')).toBe('\n')
  })

  it('moves the rules of each layer block to the top level, in order', () => {
    const css = [
      '@layer reset, base, tokens, recipes, utilities;',
      '@layer base {',
      '  #sanity {',
      '    --static-css-file-loaded-studio: true;',
      '  }',
      '}',
      '@layer utilities {',
      '  .sanity-a {',
      '    display: flex;',
      '  }',
      '  .sanity-b.sanity-b {',
      '    margin-top: 2px;',
      '  }',
      '  @media (hover: hover) {',
      '    .sanity-c:hover {',
      '      z-index: 10;',
      '    }',
      '  }',
      '}',
      '',
    ].join('\n')

    expect(unwrapCascadeLayers(css)).toBe(
      [
        '',
        '#sanity {',
        '  --static-css-file-loaded-studio: true;',
        '}',
        '.sanity-a {',
        '  display: flex;',
        '}',
        '.sanity-b.sanity-b {',
        '  margin-top: 2px;',
        '}',
        '@media (hover: hover) {',
        '  .sanity-c:hover {',
        '    z-index: 10;',
        '  }',
        '}',
        '',
      ].join('\n'),
    )
  })

  it('removes nested layer statements', () => {
    expect(
      unwrapCascadeLayers('@layer recipes { @layer base, slots, variants, compound_variants; }'),
    ).toBe('')
  })

  it('keeps minified output minified', () => {
    expect(unwrapCascadeLayers('@layer utilities{.a{color:var(--x)}.b{top:0}}')).toBe(
      '.a{color:var(--x)}.b{top:0}',
    )
  })

  it('drops the --made-with-panda marker and the :root rule it leaves empty', () => {
    expect(
      unwrapCascadeLayers(
        '@layer base {\n  :root {\n    --made-with-panda: "🐼";\n  }\n  #sanity {\n    --x: 1;\n  }\n}\n',
      ),
    ).toBe('\n#sanity {\n  --x: 1;\n}\n')
  })

  it('leaves a stylesheet without layers untouched', () => {
    const css = '.a {\n  color: red;\n}\n'
    expect(unwrapCascadeLayers(css)).toBe(css)
  })
})
