import {configure, takeSnapshot} from '@chromatic-com/vitest'
import {EditorProvider, PortableTextEditable} from '@portabletext/editor'
import {sanitySchemaToPortableTextSchema} from '@portabletext/sanity-bridge'
import {
  type ArraySchemaType,
  defineArrayMember,
  defineField,
  defineType,
  type ObjectSchemaType,
  type PortableTextBlock,
} from '@sanity/types'
import {Card, PortalProvider, usePortal} from '@sanity/ui'
import {useMemo, useState} from 'react'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {isShown, testHelpers} from '../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {useSchema} from '../../../../../hooks/useSchema'
import {
  PortableTextMemberSchemaTypesProvider,
  usePortableTextMemberSchemaTypes,
} from '../../contexts/PortableTextMemberSchemaTypes'
import {ToolbarCard} from '../../Editor.styles'
import {BlockStyleSelect} from '../BlockStyleSelect'
import {getBlockStyles} from '../helpers'

const SCHEMA_TYPES = [
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      defineField({
        type: 'array',
        name: 'body',
        title: 'Body',
        of: [defineArrayMember({type: 'block'})],
      }),
    ],
  }),
]

const INITIAL_VALUE: PortableTextBlock[] = [
  {
    _type: 'block',
    _key: 'h2',
    style: 'h2',
    markDefs: [],
    children: [{_type: 'span', _key: 'h2-s', text: 'A heading', marks: []}],
  },
  {
    _type: 'block',
    _key: 'p',
    style: 'normal',
    markDefs: [],
    children: [{_type: 'span', _key: 'p-s', text: 'A normal paragraph.', marks: []}],
  },
]

const DEFAULT_STYLE_NAMES = [
  'Normal',
  'Heading 1',
  'Heading 2',
  'Heading 3',
  'Heading 4',
  'Heading 5',
  'Heading 6',
  'Quote',
]

function StyleSelect({boundaryElement}: {boundaryElement: HTMLDivElement | null}) {
  const schemaTypes = usePortableTextMemberSchemaTypes()
  const items = useMemo(() => getBlockStyles(schemaTypes), [schemaTypes])
  return <BlockStyleSelect boundaryElement={boundaryElement} disabled={false} items={items} />
}

/**
 * The style select above a bare editable, outside the form builder. The
 * select's menu targets the named `default` portal the editor's Compositor
 * registers, so the harness registers one itself.
 */
function BlockStyleSelectHarness() {
  const schema = useSchema()
  const documentType = schema.get('test') as ObjectSchemaType
  const schemaType = documentType.fields[0].type as ArraySchemaType<PortableTextBlock>
  const initialConfig = useMemo(
    () => ({
      schemaDefinition: sanitySchemaToPortableTextSchema(schemaType),
      initialValue: INITIAL_VALUE,
    }),
    [schemaType],
  )
  const [boundaryElement, setBoundaryElement] = useState<HTMLDivElement | null>(null)
  const portal = usePortal()
  const portalElements = useMemo(() => ({default: portal.element}), [portal.element])

  return (
    <PortalProvider __unstable_elements={portalElements} element={portal.element}>
      <PortableTextMemberSchemaTypesProvider schemaType={schemaType}>
        <EditorProvider initialConfig={initialConfig}>
          <div ref={setBoundaryElement} style={{minHeight: 480}}>
            <Card border radius={1} style={{maxWidth: 480}}>
              <ToolbarCard shadow={1}>
                <div data-testid="block-style-select" style={{maxWidth: 200}}>
                  <StyleSelect boundaryElement={boundaryElement} />
                </div>
              </ToolbarCard>
              <Card padding={3}>
                <PortableTextEditable data-testid="editable" style={{outline: 'none'}} />
              </Card>
            </Card>
          </div>
        </EditorProvider>
      </PortableTextMemberSchemaTypesProvider>
    </PortalProvider>
  )
}

function Harness() {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <BlockStyleSelectHarness />
    </TestWrapper>
  )
}

describe('BlockStyleSelect', () => {
  it('names the focused block style and lists every applicable style', async () => {
    // The menu open/closed state races the automatic snapshot; archive both
    // the open menu and the closed select explicitly.
    configure({disableAutoSnapshot: true})
    const {settleChromaticEndState} = testHelpers()
    void render(<Harness />)

    const $select = page.getByTestId('block-style-select')
    // No selection yet: the select has nothing to name.
    await expect.element($select).toMatchTextContent('No style')

    // Put the caret in the heading; the select then names its style.
    await page.getByTestId('editable').getByText('A heading').click()
    await expect.element($select).toMatchTextContent('Heading 2')

    await $select.click()
    const $menu = page.getByRole('menu')
    await Promise.all(
      DEFAULT_STYLE_NAMES.map((styleName) =>
        expect.element($menu.getByText(styleName, {exact: true})).toBeVisible(),
      ),
    )
    const menuElement = $menu.element()
    // With the caret in a text block every style applies, so no item is
    // disabled and no "No style" entry is appended.
    const items = Array.from(menuElement.querySelectorAll('[role="menuitem"]'))
    expect(items.map((item) => item.textContent)).toEqual(DEFAULT_STYLE_NAMES)
    expect(menuElement.querySelectorAll('[role="menuitem"][data-disabled]')).toHaveLength(0)
    await settleChromaticEndState()
    await expect.element($menu.getByText('Heading 2', {exact: true})).toBeVisible()
    await takeSnapshot('styles-menu-open')

    await userEvent.keyboard('{Escape}')
    await expect.poll(() => isShown(menuElement), {timeout: 5_000}).toBe(false)
    await expect.element($select).toMatchTextContent('Heading 2')
    await settleChromaticEndState()
    await takeSnapshot('style-select-closed')
  })
})
