import {type PortableTextBlock} from '@sanity/types'

import {type UpsellData} from '../../../studio/upsell/types'

const DESCRIPTION: PortableTextBlock[] = [
  {
    _type: 'block',
    _key: 'title',
    style: 'h2',
    children: [
      {_type: 'span', _key: 'title-span', marks: [], text: 'Upgrade to create variant definitions'},
    ],
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
        text: 'Content variants are not available on your current plan. Upgrade your plan to create variant definitions.',
      },
    ],
    markDefs: [],
  },
]

// Stand-in cover. `UpsellDialog`'s close button is white and sits on this image; a real asset
// replaces it when the journey endpoint publishes the content.
const IMAGE: UpsellData['image'] = {
  asset: {
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='400'%3E%3Crect width='100%25' height='100%25' fill='%23111827'/%3E%3C/svg%3E",
    altText: 'Content variants',
  },
}

/**
 * Temporary content variants upsell content. `useUpsellData` settles with it while the
 * `/journey/content-variants` request is disabled. Drop the fallback and enable the request once
 * the endpoint publishes this document.
 *
 * @internal
 */
export const VARIANTS_UPSELL_DATA = {
  _createdAt: '2024-01-01T00:00:00.000Z',
  _id: 'upsell-content-variants',
  _rev: '1',
  _type: 'upsell',
  _updatedAt: '2024-01-01T00:00:00.000Z',
  ctaButton: {
    text: 'Talk to sales',
    url: 'https://www.sanity.io/contact/sales?ref=content-variants-studio-upsell',
  },
  descriptionText: DESCRIPTION,
  id: 'upsell-content-variants',
  image: IMAGE,
  secondaryButton: {
    text: 'Learn more',
    url: 'https://www.sanity.io/docs/content-variants?ref=content-variants-studio-upsell',
  },
} satisfies UpsellData
