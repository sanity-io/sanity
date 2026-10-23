import {type PortableTextBlock} from '@sanity/types'
import noop from 'lodash-es/noop.js'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {type UpsellData} from '../types'
import {UpsellDialog} from '../UpsellDialog'

const DESCRIPTION: PortableTextBlock[] = [
  {
    _type: 'block',
    _key: 'title',
    style: 'h2',
    children: [{_type: 'span', _key: 'title-span', marks: [], text: 'Unlock scheduled publishing'}],
    markDefs: [],
  },
  {
    _type: 'block',
    _key: 'body',
    style: 'normal',
    children: [
      {
        _type: 'span',
        _key: 'body-span',
        marks: [],
        text: 'Pick a date and time and let the Studio publish for you. Available on the Growth plan and up.',
      },
    ],
    markDefs: [],
  },
]

// Inline SVG data URI: keeps the story network-free while painting the
// 200px cover image the white close button floats over.
const IMAGE: UpsellData['image'] = {
  asset: {
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='400'%3E%3Crect width='100%25' height='100%25' fill='%232276fc'/%3E%3C/svg%3E",
    altText: 'Fixture illustration',
  },
}

const UPSELL_DATA: UpsellData = {
  _createdAt: '2024-01-01T00:00:00.000Z',
  _id: 'upsell-scheduled-publishing',
  _rev: '1',
  _type: 'upsell',
  _updatedAt: '2024-01-01T00:00:00.000Z',
  ctaButton: {text: 'Upgrade plan', url: 'https://www.sanity.io/pricing'},
  descriptionText: DESCRIPTION,
  id: 'upsell-scheduled-publishing',
  image: IMAGE,
  secondaryButton: {text: 'Learn more', url: 'https://www.sanity.io/docs'},
}

/**
 * Chromatic sentinel for the upsell dialog after the ui5 Flex/Box migration.
 * The Portable Text body sits in a column Flex inside a padded Box beneath
 * the cover image, with the white close button absolutely positioned over
 * the image and the CTA / secondary link pair in the Dialog footer — spacing
 * TypeScript will not catch. Distinct from `UpsellPanel` (the inline card):
 * this is the modal. Copy is a static fixture; inline SVG image; no network.
 * Harness for the co-located Storybook CSF file, which waits for the dialog
 * and blurs auto-focus.
 */
export function UpsellDialogStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <UpsellDialog
        data={UPSELL_DATA}
        onClose={noop}
        onPrimaryClick={noop}
        onSecondaryClick={noop}
      />
    </TestWrapper>
  )
}
