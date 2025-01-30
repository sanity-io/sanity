import {type UpsellData} from '../../../studio/upsell/types'

/**
 * Fallback used service is down
 * or (mostly) in cases where custom roles are used and do not have
 * project read permissions.
 */
export const FALLBACK_DIALOG: Pick<
  UpsellData,
  'ctaButton' | 'descriptionText' | 'image' | 'secondaryButton'
> = {
  // @todo: REPLACE WITH AN ACTUAL FALLBACK DIALOG, AND USE PROD
  secondaryButton: {
    text: 'Learn more',
    url: 'https://www.sanity.io/docs/content-releases?ref=content-releases-studio-upsell',
  },
  ctaButton: {
    url: 'https://www.sanity.io/contact/sales?ref=content-releases-studio-upsell',
    text: 'Contact sales',
  },
  image: {
    asset: {
      url: 'https://cdn.sanity.io/images/pyrmmpch/staging/ad8aa62076295559e0bc084865808495d0635d14-1520x720.png',
      altText: null,
    },
  },
  descriptionText: [
    {
      _key: '7aac0cf37011',
      _type: 'block',
      children: [
        {
          _key: '82a5026c219e',
          _type: 'span',
          marks: [],
          text: '',
        },
      ],
      markDefs: [],
      style: 'normal',
    },
    {
      _key: '733f69e31ef4',
      _type: 'block',
      children: [
        {
          _key: '7da96d335e41',
          _type: 'span',
          marks: [],
          text: '',
        },
        {
          _key: 'cbfb65b7245d',
          _type: 'inlineIcon',
          accent: true,
          sanityIcon: 'trend-upward',
        },
        {
          _key: '4c6d9f1c55b5',
          _type: 'span',
          marks: ['accent', 'semibold'],
          text: 'Contact us to grow',
        },
      ],
      markDefs: [],
      style: 'normal',
    },
    {
      _key: '6ff556b9f1c1',
      _type: 'block',
      children: [
        {
          _key: 'e33da3c0b801',
          _type: 'span',
          marks: [],
          text: 'Content Releases',
        },
      ],
      markDefs: [],
      style: 'h2',
    },
    {
      _key: 'd92496b324b6',
      _type: 'block',
      children: [
        {
          _key: '4e048a03fc1c',
          _type: 'span',
          marks: [],
          text: "You've created the maximum number of content releases in your plan.",
        },
      ],
      markDefs: [],
      style: 'normal',
    },
    {
      _key: 'e6d8138757ed',
      _type: 'block',
      children: [
        {
          _key: 'd6f4f88b93ea',
          _type: 'span',
          marks: [],
          text: 'Set your content to publish automatically at the perfect time. Simplify planning, manage time zones, and streamline workflows.',
        },
      ],
      markDefs: [],
      style: 'normal',
    },
  ],
}
