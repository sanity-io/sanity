import {render, waitFor} from '@testing-library/react'
import {type DocumentInspector, type DocumentInspectorMenuItem, type TFunction} from 'sanity'
import {describe, expect, it, vi} from 'vitest'

import {DocumentInspectorMenuItemsResolver} from '../DocumentInspectorMenuItemsResolver'
import {getMenuItems} from '../menuItems'
import {EMPTY_FEATURES} from './featuresFixture'

const t = ((key: string) => key) as unknown as TFunction

function inspectorWithMenuItem(name: string, title: string): DocumentInspector {
  return {name, component: () => null, useMenuItem: () => ({title})}
}

const INSPECTORS: DocumentInspector[] = [
  inspectorWithMenuItem('first', 'First'),
  {name: 'second', component: () => null},
  inspectorWithMenuItem('third', 'Third'),
]

async function resolveMenuItems() {
  const onMenuItems = vi.fn<(items: (DocumentInspectorMenuItem | undefined)[]) => void>()

  render(
    <DocumentInspectorMenuItemsResolver
      documentId="doc-1"
      documentType="author"
      inspectors={INSPECTORS}
      onMenuItems={onMenuItems}
    />,
  )

  await waitFor(() => expect(onMenuItems.mock.lastCall![0]).toContainEqual({title: 'Third'}))

  return onMenuItems.mock.lastCall![0]
}

describe('DocumentInspectorMenuItemsResolver', () => {
  it('leaves a hole for an inspector without a menu item hook', async () => {
    expect(await resolveMenuItems()).toEqual([{title: 'First'}, undefined, {title: 'Third'}])
  })

  it('keeps every title on its own inspector action', async () => {
    const inspectorMenuItems = await resolveMenuItems()

    const items = getMenuItems({
      features: EMPTY_FEATURES,
      hasValue: true,
      inspectors: INSPECTORS,
      inspectorMenuItems,
      t,
      displayInlineChanges: false,
    })

    expect(items.map((item) => [item.action, item.title])).toEqual([
      ['inspect:first', 'First'],
      ['inspect:third', 'Third'],
    ])
  })
})
