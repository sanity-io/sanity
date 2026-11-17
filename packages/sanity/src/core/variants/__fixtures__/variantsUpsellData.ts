import {type PortableTextBlock} from '@sanity/types'
import {of} from 'rxjs'

import {type UpsellData, type UpsellDataResult} from '../../studio/upsell/types'

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

/**
 * Stand-in for the `/journey/content-variants` document. Tests that render the upsell panel or
 * dialog feed this through the mocked `useUpsellData` hook.
 */
const variantsUpsellData = {
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
  image: null,
  secondaryButton: {
    text: 'Learn more',
    url: 'https://www.sanity.io/docs/content-variants?ref=content-variants-studio-upsell',
  },
} satisfies UpsellData

/** Stable, like the real hook's memoized observable, so react-rx keeps one cache entry. */
export const variantsUpsellData$ = of<UpsellDataResult>({
  upsellData: variantsUpsellData,
  hasError: false,
})
