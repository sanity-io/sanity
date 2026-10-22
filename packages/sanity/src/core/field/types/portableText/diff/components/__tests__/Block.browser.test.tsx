import {diffInput, wrap} from '@sanity/diff'
import {type Path, type PortableTextTextBlock} from '@sanity/types'
import {Card, Text} from '@sanity/ui'
import {useMemo, useState} from 'react'
import {ReviewChangesContext} from 'sanity/_singletons'
import {VStack} from 'ui5'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {testHelpers} from '../../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../../test/browser/TestWrapper'
import {type ConnectorContextValue} from '../../../../../../changeIndicators/ConnectorContext'
import {type AnnotationDetails, type ObjectDiff} from '../../../../../types'
import {type PortableTextDiff} from '../../types'
import {Block} from '../Block'

const {settleChromaticEndState} = testHelpers()

const ANNOTATION: AnnotationDetails = {author: 'doug', timestamp: '2020-06-15T12:00:00.000Z'}

function textBlock(
  key: string,
  text: string,
  style: PortableTextTextBlock['style'] = 'normal',
): PortableTextTextBlock {
  return {
    _key: key,
    _type: 'block',
    style,
    markDefs: [],
    children: [{_key: `${key}-span`, _type: 'span', text, marks: []}],
  }
}

// Mirrors `createPortableTextDiff`: the diff of the block itself, kept as
// `origin`, plus the block to display (the new one unless it was removed).
function portableTextDiff(
  from: PortableTextTextBlock | null,
  to: PortableTextTextBlock | null,
): PortableTextDiff {
  const diff = diffInput(wrap(from, ANNOTATION), wrap(to, ANNOTATION)) as ObjectDiff
  return {...diff, origin: diff, displayValue: (to ?? from) as PortableTextTextBlock}
}

const CHANGED_PARAGRAPH = portableTextDiff(
  textBlock('p', 'A paragraph, before'),
  textBlock('p', 'A paragraph, after'),
)
const ADDED_HEADER = portableTextDiff(null, textBlock('h', 'A new heading', 'h2'))
const REMOVED_QUOTE = portableTextDiff(textBlock('q', 'A removed quote', 'blockquote'), null)
const RESTYLED = portableTextDiff(
  textBlock('s', 'Now a heading', 'normal'),
  textBlock('s', 'Now a heading', 'h3'),
)

// One block per rendering branch: paragraph, header, blockquote and the
// dotted "style changed" card. `onSetFocus` is recorded so the click handler
// (which skips removed blocks) is part of what the test asserts.
function BlockHarness() {
  const [focused, setFocused] = useState<Path[]>([])
  const reviewChanges = useMemo<ConnectorContextValue>(
    () => ({
      isReviewChangesOpen: true,
      isInteractive: true,
      onOpenReviewChanges: () => undefined,
      onSetFocus: (nextPath) => setFocused((paths) => [...paths, nextPath]),
    }),
    [],
  )

  return (
    <ReviewChangesContext.Provider value={reviewChanges}>
      <Card padding={4} style={{maxWidth: 480}}>
        <VStack gap={4}>
          <div data-testid="block-paragraph">
            <Block diff={CHANGED_PARAGRAPH} block={CHANGED_PARAGRAPH.displayValue}>
              <span>A paragraph, after</span>
            </Block>
          </div>
          <div data-testid="block-header">
            <Block diff={ADDED_HEADER} block={ADDED_HEADER.displayValue}>
              <span>A new heading</span>
            </Block>
          </div>
          <div data-testid="block-blockquote">
            <Block diff={REMOVED_QUOTE} block={REMOVED_QUOTE.displayValue}>
              <span>A removed quote</span>
            </Block>
          </div>
          <div data-testid="block-restyled">
            <Block diff={RESTYLED} block={RESTYLED.displayValue}>
              <span>Now a heading</span>
            </Block>
          </div>
          <Text data-testid="focus-count" size={1}>
            {`focus calls: ${focused.length}`}
          </Text>
        </VStack>
      </Card>
    </ReviewChangesContext.Provider>
  )
}

describe('Block', () => {
  it('wraps a block per style and reports focus for everything but removed blocks', async () => {
    void render(
      <TestWrapper schemaTypes={[]}>
        <BlockHarness />
      </TestWrapper>,
    )

    const paragraph = page.getByTestId('block-paragraph')
    const header = page.getByTestId('block-header')
    const blockquote = page.getByTestId('block-blockquote')
    const restyled = page.getByTestId('block-restyled')
    const focusCount = page.getByTestId('focus-count')

    await expect.element(paragraph.getByText('A paragraph, after')).toBeVisible()
    expect(paragraph.element().querySelector('[data-diff-block-action="changed"]')).not.toBeNull()

    await expect.element(header.getByText('A new heading')).toBeVisible()
    expect(
      header.element().querySelector('[data-diff-block-action="added"] [data-ui="Heading"]'),
    ).not.toBeNull()

    await expect.element(blockquote.getByText('A removed quote')).toBeVisible()
    expect(
      blockquote.element().querySelector('[data-diff-block-action="removed"] blockquote'),
    ).not.toBeNull()

    await expect
      .element(restyled.getByText('Changed block style from "normal" to "h3"'))
      .toBeVisible()
    expect(
      restyled
        .element()
        .querySelector('[data-block-note="changed_from_style_normal"] [data-ui="Heading"]'),
    ).not.toBeNull()

    // Clicking a changed or added block focuses its path; a removed block has
    // nothing left in the form to focus.
    await expect.element(focusCount).toHaveTextContent('focus calls: 0')
    await userEvent.click(paragraph.getByText('A paragraph, after'))
    await expect.element(focusCount).toHaveTextContent('focus calls: 1')
    await userEvent.click(header.getByText('A new heading'))
    await expect.element(focusCount).toHaveTextContent('focus calls: 2')
    await userEvent.click(blockquote.getByText('A removed quote'))
    await expect.element(focusCount).toHaveTextContent('focus calls: 2')

    await settleChromaticEndState()
  })
})
