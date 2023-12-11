import {FreeTrialResponse} from './types'

export const responses: FreeTrialResponse[] = [
  {
    _type: 'planButton',
    icon: 'zap',
    _id: '6b72788f-1a67-4f87-9d1e-ceff2780eaf5',
    id: 'growth-trial',

    _rev: 'zHeFW2t7bUb3lAyGGnuX1H',
    _updatedAt: '2023-12-04T17:38:56Z',
    style: 'purple',
    text: 'Trial',
    showOnLoad: 'popover',
    _createdAt: '2023-12-03T18:13:37Z',
    popover: {
      _updatedAt: '2023-12-04T17:33:59Z',
      _id: '8d2b30a2-5aaf-48b4-8cb7-7a873b6f6083',
      id: 'trial-popover',
      image: null,
      ctaButton: {text: 'Learn more', url: 'https://sanity.io/mange'},
      _rev: 'zHeFW2t7bUb3lAyGGnuD2T',
      _createdAt: '2023-12-03T18:13:11Z',
      _type: 'dialog',
      secondaryButton: {text: 'Maybe later'},
      descriptionText: [
        {
          style: 'normal',
          _key: 'c9f01c0d7675',
          markDefs: [],
          children: [
            {
              _key: '1e731ecffa810',
              _type: 'span',
              marks: [],
              text: 'Some features will become unavailable if you do not upgrade your plan.',
            },
          ],
          _type: 'block',
        },
      ],
      dialogType: 'popover',
      headingText: 'Your trial is ending soon',
    },
    modal: {
      image: {
        asset: {
          url: 'https://cdn.sanity.io/images/pyrmmpch/staging/cbf3e436084a93bb1a6de4114cf4054d379f30d5-3500x2000.webp',
          altText: null,
        },
      },
      _createdAt: '2023-12-04T13:59:05Z',
      _type: 'dialog',
      _id: 'f28b74e0-d0e5-47cb-9a63-0a996ccfb346',
      dialogType: 'modal',
      headingText: '{{daysLeft}} days left in trial',
      descriptionText: [
        {
          children: [
            {
              text: 'For a limited amount of time your project has access to paid features from the Growth plan.',
              _key: '7b734ad35d980',
              _type: 'span',
              marks: [],
            },
          ],
          _type: 'block',
          style: 'normal',
          _key: '7ca84374b214',
          markDefs: [],
        },
        {
          markDefs: [{href: 'https://www.sanity.io/', _key: 'f4b15a67a148', _type: 'link'}],
          children: [
            {
              _type: 'span',
              marks: ['f4b15a67a148'],
              text: 'Learn more about the trial',
              _key: 'c02f1627ef450',
            },
          ],
          _type: 'block',
          style: 'normal',
          _key: 'db1c1c51d697',
        },
        {divider: true, _type: 'divider', _key: '8315a3d902f8'},
        {
          style: 'normal',
          _key: '87560142ef72',
          markDefs: [],
          children: [
            {
              _type: 'span',
              marks: [],
              text: 'Upgrade you plan before the trial ends, to keep using paid features like ...',
              _key: 'd62e9ad6fae00',
            },
          ],
          _type: 'block',
        },
        {
          title: 'Comments',
          _type: 'iconAndText',
          icon: {
            url: 'https://cdn.sanity.io/images/pyrmmpch/staging/41295060083ba31fbd730590c4b742b327297ec4-21x21.svg',
          },
          text: 'Closer Studio collaboration',
          _key: 'd6180522e836',
        },
        {
          _key: '4681ff7dd72a',
          title: 'AI assist',
          _type: 'iconAndText',
          icon: {
            url: 'https://cdn.sanity.io/images/pyrmmpch/staging/bed5682bce2e68fe22044917158d014b0f4949af-22x21.svg',
          },
          text: 'Automate your content chores',
        },
        {
          _type: 'iconAndText',
          icon: {
            url: 'https://cdn.sanity.io/images/pyrmmpch/staging/1caa6b91775d4ac3ec294dcb8ca4444ccdd07d51-21x21.svg',
          },
          text: 'Assign access control per user',
          _key: '7a40c79dc6fd',
          title: 'User roles',
        },
        {
          _type: 'iconAndText',
          icon: {
            url: 'https://cdn.sanity.io/images/pyrmmpch/staging/89ffef74b3ccf8cc0e6f5d792e673fdb839546e3-21x21.svg',
          },
          text: 'Fine grain publishing controls',
          _key: '814251f1635c',
          title: 'Scheduling',
        },
      ],
      ctaButton: {url: 'https://www.sanity.io/manage', text: 'Upgrade plan'},
      secondaryButton: {text: 'Maybe later'},
      _rev: 'LDCVHimI6r4jzwxT3Is0sd',
      id: 'days-left',
      _updatedAt: '2023-12-04T17:34:02Z',
    },
    daysLeft: 15,
  },
]
