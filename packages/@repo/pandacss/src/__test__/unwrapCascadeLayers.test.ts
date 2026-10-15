import {describe, expect, it} from 'vitest'

import {unwrapCascadeLayers} from '../unwrapCascadeLayers.ts'

describe('unwrapCascadeLayers()', () => {
  it('keeps a top-level layer order statement', () => {
    const statement = '@layer sui, u-tokens, u-utilities, sanity-base, sanity-utilities;\n'
    expect(unwrapCascadeLayers(statement)).toBe(statement)
  })

  it('moves the rules of each layer block to the top level, in order', () => {
    const css = [
      '@layer sui, u-tokens, u-utilities, sanity-base, sanity-utilities;',
      '@layer sanity-base {',
      '  #sanity {',
      '    --static-css-file-loaded-studio: true;',
      '  }',
      '}',
      '@layer sanity-utilities {',
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
        '@layer sui, u-tokens, u-utilities, sanity-base, sanity-utilities;',
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

  it('removes a layer statement nested in a block together with the block', () => {
    expect(
      unwrapCascadeLayers(
        '@layer sanity-recipes { @layer base, slots, variants, compound_variants; }',
      ),
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
