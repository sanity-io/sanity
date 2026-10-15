import {describe, expect, test} from 'vitest'

import {unwrapCascadeLayers} from '../cascadeLayers.ts'

// The cases @sanity/pandacss-tsdown-plugin checks its own copy of the pass with, so a drift
// between the two shows up here before it shows up as a difference between the dev stylesheet
// and the published `bundle.css`.
describe('unwrapCascadeLayers()', () => {
  test("emits a layer's sublayers before its own rules, and the unlayered rules last", () => {
    expect(
      unwrapCascadeLayers(
        '.top{a:1}@layer a{.a1{a:1}@layer b{.b{a:1}}.a2{a:1}}@layer a.c{.c{a:1}}@layer a{@layer b{.b2{a:1}}}',
      ),
    ).toBe('.b{a:1}.b2{a:1}.c{a:1}.a1{a:1}.a2{a:1}.top{a:1}')
  })

  test('orders the layers by their first declaration, statements included', () => {
    expect(unwrapCascadeLayers('@layer z, y.x;@layer y{.y{}}@layer y.x{.x{}}@layer z{.z{}}')).toBe(
      '.z{}.x{}.y{}',
    )
  })

  test("keeps Panda's text styles below the utilities they are emitted after", () => {
    // `utilities.compositions` loses to `utilities` by layer precedence; in-place unwrapping
    // would have let it win by source order
    expect(
      unwrapCascadeLayers(
        '@layer utilities{.x{color:blue}@media print{@layer compositions{.x{color:red}}}}',
      ),
    ).toBe('@media print{.x{color:red}}.x{color:blue}')
  })

  test('splits a conditional rule across the layers of its rules, in copies of it', () => {
    expect(
      unwrapCascadeLayers(
        '@layer u{@supports (display:grid){@media print{.p{} @layer s{.s{}} .q{}}}@layer t{.t{}}.u{}}',
      ),
    ).toBe(
      '@supports (display:grid){@media print{.s{}}}.t{}@supports (display:grid){@media print{.p{} .q{}}}.u{}',
    )
    expect(unwrapCascadeLayers('@layer u{@media print{ .p{} }}')).toBe('@media print{ .p{} }')
  })

  test('moves the rules of each layer block to the top level, re-indented', () => {
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
        '#sanity {',
        '  --static-css-file-loaded-studio: true;',
        '}',
        '',
        '.sanity-a {',
        '  display: flex;',
        '}',
        '',
        '@media (hover: hover) {',
        '  .sanity-c:hover {',
        '    z-index: 10;',
        '  }',
        '}',
        '',
      ].join('\n'),
    )
  })

  test('keeps custom property values opaque, `@layer` in them included', () => {
    const css = ':root{--rules:{@layer theme{color:red}};--color:blue}'
    expect(unwrapCascadeLayers(css)).toBe(css)
    expect(unwrapCascadeLayers(`@layer a{${css}}`)).toBe(css)
  })

  test('leaves a stylesheet without layers untouched', () => {
    const css = '.a {\n  color: red;\n}\n'
    expect(unwrapCascadeLayers(css)).toBe(css)
  })
})
