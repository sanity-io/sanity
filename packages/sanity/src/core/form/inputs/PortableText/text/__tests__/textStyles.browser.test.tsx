import {Card} from '@sanity/ui'
import {VStack} from 'ui5'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {TEXT_STYLES} from '../textStyles'

const STYLE_TITLES: Record<string, string> = {
  normal: 'Normal',
  h1: 'Heading 1',
  h2: 'Heading 2',
  h3: 'Heading 3',
  h4: 'Heading 4',
  h5: 'Heading 5',
  h6: 'Heading 6',
  blockquote: 'Quote',
}

/** Every built-in text style, rendered the way the editor and the style select render them. */
function TextStylesHarness() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={5} style={{maxWidth: 560}}>
        <VStack gap={4}>
          {Object.entries(TEXT_STYLES).map(([style, StyleComponent]) => (
            <StyleComponent key={style}>{STYLE_TITLES[style]} text style</StyleComponent>
          ))}
        </VStack>
      </Card>
    </TestWrapper>
  )
}

describe('textStyles', () => {
  it('renders every built-in Portable Text style', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<TextStylesHarness />)

    await Promise.all(
      Object.entries(STYLE_TITLES).map(([style, title]) =>
        expect
          .element(page.getByTestId(`text-style--${style}`))
          .toMatchTextContent(`${title} text style`),
      ),
    )
    await Promise.all(
      [1, 2, 3, 4, 5, 6].map((level) =>
        expect
          .element(page.getByRole('heading', {level}))
          .toMatchTextContent(`Heading ${level} text style`),
      ),
    )
    expect(
      document.querySelector('blockquote[data-testid="text-style--blockquote"]'),
    ).not.toBeNull()

    await settleChromaticEndState()
    await expect.element(page.getByTestId('text-style--normal')).toBeVisible()
  })
})
