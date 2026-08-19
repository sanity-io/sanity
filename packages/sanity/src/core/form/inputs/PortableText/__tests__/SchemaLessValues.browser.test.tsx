import {defineArrayMember, defineField, defineType, type Path} from '@sanity/types'
import {toString as pathToString} from '@sanity/util/paths'
import {describe, expect, it, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {TestForm} from '../../../../../../test/browser/TestForm'
import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {SchemaLessValuesStory} from './SchemaLessValuesStory'

const WARNING_PATH_SCHEMA_TYPES = [
  defineType({
    type: 'document',
    name: 'test',
    fields: ['primaryBody', 'secondaryBody'].map((name) =>
      defineField({
        type: 'array',
        name,
        of: [
          defineArrayMember({
            type: 'block',
            marks: {decorators: [], annotations: []},
          }),
        ],
      }),
    ),
  }),
]

function createSharedWarningValue() {
  return [
    {
      _type: 'block',
      _key: 'sharedWarningBlock',
      style: 'normal',
      markDefs: [{_type: 'regressionAnnotation', _key: 'sharedAnnotation'}],
      children: [
        {
          _type: 'span',
          _key: 'sharedWarningSpan',
          text: 'shared schema-less values',
          marks: ['regressionMark', 'sharedAnnotation'],
        },
      ],
    },
  ]
}

const WARNING_PATH_DOCUMENT = {
  _id: 'warning-paths',
  _type: 'test',
  _createdAt: '2026-08-18T00:00:00Z',
  _updatedAt: '2026-08-18T00:00:00Z',
  _rev: 'warning-paths',
  primaryBody: createSharedWarningValue(),
  secondaryBody: createSharedWarningValue(),
}

const SHARED_SPAN_PATH: Path = [
  {_key: 'sharedWarningBlock'},
  'children',
  {_key: 'sharedWarningSpan'},
]

function WarningPathsStory() {
  return (
    <TestWrapper schemaTypes={WARNING_PATH_SCHEMA_TYPES}>
      <TestForm document={WARNING_PATH_DOCUMENT} />
    </TestWrapper>
  )
}

describe('Portable Text Input', () => {
  describe('Values whose types left the schema', () => {
    it('warns once for identical mark locations in separate form fields', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

      try {
        void render(<WarningPathsStory />)
        const {getFocusedPortableTextInput} = testHelpers()
        await getFocusedPortableTextInput('field-primaryBody')
        await getFocusedPortableTextInput('field-secondaryBody')

        const expectedWarnings = ['primaryBody', 'secondaryBody'].flatMap((fieldName) => {
          const qualifiedPath = pathToString([fieldName, ...SHARED_SPAN_PATH])
          return [
            `Could not find schema type for mark: regressionMark at ${qualifiedPath}`,
            `Could not find schema type for annotation: regressionAnnotation at ${qualifiedPath}`,
          ]
        })

        await vi.waitFor(() => {
          const relevantWarnings = warnSpy.mock.calls
            .map(([message]) => message)
            .filter(
              (message) =>
                typeof message === 'string' &&
                (message.includes('regressionMark') || message.includes('regressionAnnotation')),
            )

          expect(relevantWarnings).toHaveLength(expectedWarnings.length)
          expect(relevantWarnings).toEqual(expect.arrayContaining(expectedWarnings))
        })
      } finally {
        warnSpy.mockRestore()
      }
    })

    // The story's document carries a `listItem`, a `style`, a decorator,
    // an annotation, and two stacked combinations that the (tightened)
    // schema no longer declares. Each block must render its text plainly
    // instead of crashing the pane.
    it('renders every block despite schema-less values', async () => {
      const {getFocusedPortableTextInput} = testHelpers()
      void render(<SchemaLessValuesStory />)
      const $portableTextInput = await getFocusedPortableTextInput('field-body')

      await expect.element($portableTextInput.getByText('schema-less list item')).toBeVisible()
      await expect
        .element($portableTextInput.getByText('schema-less style', {exact: true}))
        .toBeVisible()
      await expect.element($portableTextInput.getByText('schema-less decorator')).toBeVisible()
      await expect.element($portableTextInput.getByText('schema-less annotation')).toBeVisible()
    })

    // Every schema-less value is wrapped in the dotted-underline affordance,
    // and its tooltip names the value that left the schema.
    it('marks schema-less values with an affordance and an explaining tooltip', async () => {
      const {getFocusedPortableTextInput} = testHelpers()
      void render(<SchemaLessValuesStory />)
      const $portableTextInput = await getFocusedPortableTextInput('field-body')

      await vi.waitFor(() => {
        const affordances = Array.from(document.querySelectorAll('[data-testid="unknown-value"]'))
        expect(affordances.map((affordance) => affordance.textContent)).toEqual([
          'schema-less list item',
          'schema-less style',
          'schema-less decorator',
          'schema-less annotation',
          'schema-less style and list',
          'schema-less mark and annotation',
        ])
      })

      await userEvent.hover($portableTextInput.getByText('schema-less decorator'))
      await expect
        .element(page.getByText('Mark not defined in the schema: em', {exact: true}))
        .toBeVisible()

      await userEvent.hover($portableTextInput.getByText('schema-less annotation'))
      await expect
        .element(page.getByText('Annotation not defined in the schema: link', {exact: true}))
        .toBeVisible()
    })

    // Two schema-less values on the same node share one affordance with the
    // labels joined, instead of nesting two wrappers with two tooltips.
    it('joins stacked schema-less values into a single affordance', async () => {
      const {getFocusedPortableTextInput} = testHelpers()
      void render(<SchemaLessValuesStory />)
      const $portableTextInput = await getFocusedPortableTextInput('field-body')

      await userEvent.hover($portableTextInput.getByText('schema-less style and list'))
      await expect
        .element(
          page.getByText(
            'Style not defined in the schema: h2; List type not defined in the schema: number',
          ),
        )
        .toBeVisible()

      await userEvent.hover($portableTextInput.getByText('schema-less mark and annotation'))
      await expect
        .element(
          page.getByText(
            'Mark not defined in the schema: em; Annotation not defined in the schema: link',
          ),
        )
        .toBeVisible()
    })

    // A schema-less list type renders without a list marker: no
    // `data-list-item`, no prefix element, only the affordance. The marker
    // is drawn by `TextBlock` from the block's own `listItem`, so it must
    // resolve against the schema there too. Spacing (paddings, level
    // indent, `pt-list-item` margins) deliberately stays: Studio's rhythm
    // CSS keys off raw value names and was never schema-resolved.
    it('renders no list marker for a schema-less list type', async () => {
      const {getFocusedPortableTextInput} = testHelpers()
      void render(<SchemaLessValuesStory />)
      await getFocusedPortableTextInput('field-body')

      await vi.waitFor(() => {
        const textBlocks = Array.from(document.querySelectorAll('[data-testid="text-block__text"]'))
        const blockWithText = (text: string) =>
          textBlocks.find((textBlock) => textBlock.textContent?.includes(text))

        const listBlock = blockWithText('schema-less list item')
        const definedListBlock = blockWithText('schema-defined list item')
        expect(listBlock).toBeDefined()
        expect(definedListBlock).toBeDefined()
        expect(listBlock?.hasAttribute('data-list-item')).toBe(false)
        expect(listBlock?.querySelector('[data-list-prefix]')).toBeNull()

        const outerPadding = (textBlock: Element) => {
          const root = textBlock.closest<HTMLElement>('[data-testid="text-block"]')
          expect(root).not.toBeNull()
          const style = getComputedStyle(root!)
          return {paddingBottom: style.paddingBottom, paddingTop: style.paddingTop}
        }

        expect(outerPadding(listBlock!)).toEqual(outerPadding(definedListBlock!))
      })
    })
  })
})
