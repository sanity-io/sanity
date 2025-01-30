import {type UpsellData} from '../../../studio/upsell/types'

export const FALLBACK_DIALOG: Pick<
  UpsellData,
  'ctaButton' | 'descriptionText' | 'image' | 'secondaryButton'
> = {
  ctaButton: {
    text: 'Upgrade plan',
    url: 'https://www.sanity.io/manage',
  },
  descriptionText: [
    {
      _key: '35d801e98e2c',
      _type: 'block',
      children: [
        {
          _key: '61915fa6a0d1',
          _type: 'span',
          marks: [],
          text: '',
        },
        {
          _key: '43dd4b01f229',
          _type: 'inlineIcon',
          accent: true,
          sanityIcon: 'add-circle',
        },
        {
          _key: 'c9b0fe28bbea',
          _type: 'span',
          marks: [],
          text: '',
        },
      ],
      markDefs: [],
      style: 'normal',
    },
    {
      _key: 'f2a2e1e9fd8c',
      _type: 'block',
      children: [
        {
          _key: '4882487a1882',
          _type: 'span',
          marks: [],
          text: "You are on the free trial, you can't make releases.",
        },
      ],
      markDefs: [],
      style: 'normal',
    },
    {
      _key: '7a49a331826d',
      _type: 'block',
      children: [
        {
          _key: '5f3a55c1d503',
          _type: 'span',
          marks: [],
          text: "Upgrade to growth to make FALL BACK 'em",
        },
      ],
      markDefs: [],
      style: 'normal',
    },
  ],
  secondaryButton: {
    text: 'Learn more',
    url: 'https://www.sanity.io/docs/comments',
  },
}
