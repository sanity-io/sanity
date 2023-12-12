import {FreeTrialResponse} from './types'

export const responses: FreeTrialResponse[] = [
  {
    daysLeft: 15,

    modal: {
      id: 'days-left',
      image: {
        asset: {
          url: 'https://cdn.sanity.io/images/pyrmmpch/staging/271c0c23c0c7d4dc127969d58680a57665a9df2e-768x432.png',
          altText: null,
        },
      },
      _id: 'f28b74e0-d0e5-47cb-9a63-0a996ccfb346',
      descriptionText: [
        {
          markDefs: [],
          children: [
            {
              _type: 'span',
              marks: [],
              text: 'For a limited amount of time your project has access to paid features from the Growth plan.',
              _key: '7b734ad35d980',
            },
          ],
          _type: 'block',
          style: 'normal',
          _key: '7ca84374b214',
        },
        {
          style: 'normal',
          _key: 'db1c1c51d697',
          markDefs: [
            {
              _type: 'link',
              href: 'https://www.sanity.io/',
              _key: 'f4b15a67a148',
              useTextColor: false,
              showIcon: true,
            },
          ],
          children: [
            {
              _type: 'span',
              marks: ['f4b15a67a148'],
              text: 'Learn more about the trial',
              _key: 'c02f1627ef450',
            },
          ],
          _type: 'block',
        },
        {divider: true, _type: 'divider', _key: '8315a3d902f8'},
        {
          children: [
            {
              _type: 'span',
              marks: [],
              text: 'Upgrade you plan before the trial ends, to keep using paid features like ...',
              _key: 'd62e9ad6fae00',
            },
          ],
          _type: 'block',
          style: 'normal',
          _key: '87560142ef72',
          markDefs: [],
        },
        {
          icon: {
            url: 'https://cdn.sanity.io/images/pyrmmpch/staging/41295060083ba31fbd730590c4b742b327297ec4-21x21.svg',
          },
          text: 'Closer Studio collaboration',
          _key: 'd6180522e836',
          title: 'Comments',
          _type: 'iconAndText',
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
          icon: {
            url: 'https://cdn.sanity.io/images/pyrmmpch/staging/1caa6b91775d4ac3ec294dcb8ca4444ccdd07d51-21x21.svg',
          },
          text: 'Assign access control per user',
          _key: '7a40c79dc6fd',
          title: 'User roles',
          _type: 'iconAndText',
        },
        {
          title: 'Scheduling',
          _type: 'iconAndText',
          icon: {
            url: 'https://cdn.sanity.io/images/pyrmmpch/staging/89ffef74b3ccf8cc0e6f5d792e673fdb839546e3-21x21.svg',
          },
          text: 'Fine grain publishing controls',
          _key: '814251f1635c',
        },
      ],
      _updatedAt: '2023-12-12T07:41:52Z',
      _type: 'dialog',
      secondaryButton: {text: 'Maybe later'},
      _rev: 'Nka2T75McG1QANe0fuuDU0',
      dialogType: 'modal',
      _createdAt: '2023-12-04T13:59:05Z',
      ctaButton: {
        url: 'https://{{baseUrl}}/manage/project/{{projectId}}/plan',
        text: 'Upgrade plan',
      },
      headingText: '15 days left in trial',
    },
    popover: {
      _type: 'dialog',
      id: 'Free-upgrade-popover',
      headingText: 'You got a free upgrade!',
      dialogType: 'popover',
      _rev: '8avtREtROnfB6XaITvVR26',
      _updatedAt: '2023-12-12T10:12:02Z',
      ctaButton: {
        text: 'Upgrade plan',
        url: 'https://{{baseUrl}}/manage/project/{{projectId}}/plan',
      },
      image: {
        asset: {
          url: 'https://cdn.sanity.io/images/pyrmmpch/staging/9ab84fdbff60036f5e96c43a05f1421632b4e157-768x432.png',
          altText: null,
        },
      },
      _createdAt: '2023-12-11T17:45:26Z',
      secondaryButton: {text: 'Maybe later'},
      _id: '5a6e91f3-4c3b-4329-a5bf-cce4724735c5',
      descriptionText: [
        {
          markDefs: [
            {
              useTextColor: true,
              showIcon: false,
              _type: 'link',
              href: 'https://www.sanity.io/plugins/scheduled-publishing',
              _key: '1a92fec94f07',
            },
            {
              _key: '84f277b5a838',
              useTextColor: true,
              showIcon: false,
              _type: 'link',
            },
            {
              _type: 'link',
              _key: '539d7c9fd183',
              useTextColor: true,
              showIcon: false,
            },
          ],
          children: [
            {
              _type: 'span',
              marks: [],
              text: 'For a limited amount of time you get access to paid features like ',
              _key: 'd1adbc6e06b10',
            },
            {
              _type: 'span',
              marks: ['strong', '539d7c9fd183'],
              text: 'Comments',
              _key: 'd23b54a26da9',
            },
            {
              _type: 'span',
              marks: ['strong'],
              text: ', ',
              _key: 'f378f73f0e08',
            },
            {
              _type: 'span',
              marks: ['strong', '84f277b5a838'],
              text: 'AI Assist',
              _key: 'daf3bcb771d0',
            },
            {
              _type: 'span',
              marks: ['strong'],
              text: ', ',
              _key: '73532a91718c',
            },
            {
              _type: 'span',
              marks: ['strong', '1a92fec94f07'],
              text: 'Scheduled Publishing',
              _key: 'f6bcd8b29cc0',
            },
            {
              text: ', and more.',
              _key: '9194945a40b4',
              _type: 'span',
              marks: [],
            },
          ],
          _type: 'block',
          style: 'normal',
          _key: '52332edb8c3f',
        },
        {
          _type: 'block',
          style: 'normal',
          _key: '310bf277c74c',
          markDefs: [],
          children: [
            {
              _type: 'span',
              marks: [],
              text: 'Click the ',
              _key: 'a2f34a763da9',
            },
            {
              _type: 'inlineIcon',
              icon: {
                url: 'https://cdn.sanity.io/images/pyrmmpch/staging/3c5c9bc6ace28b83737afcd495b842e67b35a862-21x21.svg',
              },
              _key: '3fb6a4b7bdfd',
            },
            {
              _type: 'span',
              marks: [],
              text: ' to learn more.',
              _key: '42568b3e6edb',
            },
          ],
        },
      ],
    },
    id: 'growth-trial',
    icon: 'zap',
    style: 'purple',
    showOnLoad: 'popover',
  },
  {
    showOnLoad: 'popover',
    modal: {
      _id: 'f28b74e0-d0e5-47cb-9a63-0a996ccfb346',
      descriptionText: [
        {
          markDefs: [],
          children: [
            {
              _type: 'span',
              marks: [],
              text: 'For a limited amount of time your project has access to paid features from the Growth plan.',
              _key: '7b734ad35d980',
            },
          ],
          _type: 'block',
          style: 'normal',
          _key: '7ca84374b214',
        },
        {
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
          markDefs: [
            {
              href: 'https://www.sanity.io/',
              _key: 'f4b15a67a148',
              useTextColor: false,
              showIcon: true,
              _type: 'link',
            },
          ],
        },
        {divider: true, _type: 'divider', _key: '8315a3d902f8'},
        {
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
          style: 'normal',
          _key: '87560142ef72',
        },
        {
          _type: 'iconAndText',
          icon: {
            url: 'https://cdn.sanity.io/images/pyrmmpch/staging/41295060083ba31fbd730590c4b742b327297ec4-21x21.svg',
          },
          text: 'Closer Studio collaboration',
          _key: 'd6180522e836',
          title: 'Comments',
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
          icon: {
            url: 'https://cdn.sanity.io/images/pyrmmpch/staging/1caa6b91775d4ac3ec294dcb8ca4444ccdd07d51-21x21.svg',
          },
          text: 'Assign access control per user',
          _key: '7a40c79dc6fd',
          title: 'User roles',
          _type: 'iconAndText',
        },
        {
          text: 'Fine grain publishing controls',
          _key: '814251f1635c',
          title: 'Scheduling',
          _type: 'iconAndText',
          icon: {
            url: 'https://cdn.sanity.io/images/pyrmmpch/staging/89ffef74b3ccf8cc0e6f5d792e673fdb839546e3-21x21.svg',
          },
        },
      ],
      _createdAt: '2023-12-04T13:59:05Z',
      secondaryButton: {text: 'Maybe later'},
      _rev: 'Nka2T75McG1QANe0fuuDU0',
      id: 'days-left',
      ctaButton: {
        url: 'https://{{baseUrl}}/manage/project/{{projectId}}/plan',
        text: 'Upgrade plan',
      },
      headingText: '10 days left in trial',
      image: {
        asset: {
          url: 'https://cdn.sanity.io/images/pyrmmpch/staging/271c0c23c0c7d4dc127969d58680a57665a9df2e-768x432.png',
          altText: null,
        },
      },
      _updatedAt: '2023-12-12T07:41:52Z',
      dialogType: 'modal',
      _type: 'dialog',
    },
    popover: {
      id: 'trial-ending-popover',
      ctaButton: {
        text: 'Learn more',
        url: 'https://{{baseUrl}}/manage/project/{{projectId}}/plan',
      },
      dialogType: 'popover',
      headingText: 'Your trial is ending soon',
      _createdAt: '2023-12-03T18:13:11Z',
      _type: 'dialog',
      image: null,
      secondaryButton: {text: 'Maybe later'},
      _rev: 'kEHuFmUBKgAmSEW7Bi1nBC',
      descriptionText: [
        {
          markDefs: [],
          children: [
            {
              _type: 'span',
              marks: [],
              text: 'Some features will become unavailable if you do not upgrade your plan.',
              _key: '1e731ecffa810',
            },
          ],
          _type: 'block',
          style: 'normal',
          _key: 'c9f01c0d7675',
        },
      ],
      _updatedAt: '2023-12-12T07:26:33Z',
      _id: '8d2b30a2-5aaf-48b4-8cb7-7a873b6f6083',
    },
    id: 'growth-trial-ending',
    icon: 'zap',
    style: 'purple',
    daysLeft: 10,
  },

  {
    daysLeft: 0,
    id: 'post-growth-trial',
    icon: 'zap',
    style: 'clear',
    showOnLoad: 'none',
    modal: {
      _type: 'dialog',
      _updatedAt: '2023-12-12T07:42:05Z',
      dialogType: 'modal',
      secondaryButton: {text: 'Maybe later'},
      ctaButton: {
        text: 'Upgrade plan',
        url: 'https://{{baseUrl}}/manage/project/{{projectId}}/plan',
      },
      id: 'after-trial-upgrade',
      _createdAt: '2023-12-11T21:08:40Z',
      _rev: 'A6877bpl8a6IECeaPtNvRx',
      descriptionText: [
        {
          _type: 'block',
          style: 'normal',
          _key: '7a4e6c00d565',
          markDefs: [],
          children: [
            {
              _key: '5e3930629ddf',
              _type: 'span',
              marks: [],
              text: 'For a limited amount of time your project has access to paid features from the Growth plan.',
            },
          ],
        },
        {
          style: 'normal',
          _key: '2f0a84081566',
          markDefs: [
            {
              useTextColor: false,
              showIcon: true,
              _type: 'link',
              href: 'https://www.sanity.io/pricing',
              _key: '1c9c10d54bda',
            },
          ],
          children: [
            {
              _type: 'span',
              marks: ['1c9c10d54bda'],
              text: 'Compare plans on our pricing page',
              _key: 'db60adfacaf4',
            },
          ],
          _type: 'block',
        },
        {divider: true, _type: 'divider', _key: '3f055fb372a7'},
        {
          style: 'normal',
          _key: 'fe1b6bfc19d7',
          markDefs: [],
          children: [
            {
              _key: '3ea4d0e8d9f60',
              _type: 'span',
              marks: [],
              text: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
            },
          ],
          _type: 'block',
        },
        {
          _type: 'iconAndText',
          icon: {
            url: 'https://cdn.sanity.io/images/pyrmmpch/staging/07c3155890a06dec083c304205619af7b7edfbf7-21x22.svg',
          },
          text: 'Closer Studio collaboration',
          _key: 'e7503e6d00df',
          title: 'Comments',
        },
        {
          _key: '4a7fcf985fc3',
          title: 'AI assist',
          _type: 'iconAndText',
          icon: {
            url: 'https://cdn.sanity.io/images/pyrmmpch/staging/07c3155890a06dec083c304205619af7b7edfbf7-21x22.svg',
          },
          text: 'Automate your content chores',
        },
        {
          _type: 'iconAndText',
          icon: {
            url: 'https://cdn.sanity.io/images/pyrmmpch/staging/07c3155890a06dec083c304205619af7b7edfbf7-21x22.svg',
          },
          text: 'Assign access control per user',
          _key: '2fcf3f4d1d1a',
          title: 'User roles',
        },
        {
          _type: 'iconAndText',
          icon: {
            url: 'https://cdn.sanity.io/images/pyrmmpch/staging/07c3155890a06dec083c304205619af7b7edfbf7-21x22.svg',
          },
          text: 'Fine grain publishing controls',
          _key: '9a71c9908fe1',
          title: 'Scheduling',
        },
      ],
      image: {
        asset: {
          url: 'https://cdn.sanity.io/images/pyrmmpch/staging/8d4e98554c37c4db9fbb7a9667fb7b999f9904d4-384x216.png',
          altText: null,
        },
      },
      headingText: 'Upgrade your project',
      _id: 'db75cb60-4cfb-48cd-ab62-ec60e9d2541f',
    },
    popover: {
      ctaButton: {
        text: 'Upgrade plan',
        url: 'https://{{baseUrl}}/manage/project/{{projectId}}/plan',
      },
      image: {
        asset: {
          url: 'https://cdn.sanity.io/images/pyrmmpch/staging/c37893ba08476e7746dedc38847fdd8d4b6e54c2-768x432.png',
          altText: null,
        },
      },
      _type: 'dialog',
      dialogType: 'modal',
      secondaryButton: {text: 'Maybe later'},
      _id: '8e5a0f9b-7292-4f41-8272-d3642369cd40',
      descriptionText: [
        {
          children: [
            {
              _type: 'span',
              marks: [],
              text: 'For a limited amount of time your project has access to paid features from the Growth plan.',
              _key: '7b734ad35d980',
            },
          ],
          _type: 'block',
          style: 'normal',
          _key: '7ca84374b214',
          markDefs: [],
        },
        {
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
          markDefs: [
            {
              href: 'https://www.sanity.io/',
              _key: 'f4b15a67a148',
              showIcon: true,
              _type: 'link',
            },
          ],
        },
        {divider: true, _type: 'divider', _key: '8315a3d902f8'},
        {
          children: [
            {
              _key: 'd62e9ad6fae00',
              _type: 'span',
              marks: [],
              text: 'Upgrade you plan before the trial ends, to keep using paid features like ...',
            },
          ],
          _type: 'block',
          style: 'normal',
          _key: '87560142ef72',
          markDefs: [],
        },
        {
          title: 'Comments',
          _type: 'iconAndText',
          icon: {
            url: 'https://cdn.sanity.io/images/pyrmmpch/staging/07c3155890a06dec083c304205619af7b7edfbf7-21x22.svg',
          },
          text: 'Closer Studio collaboration',
          _key: 'd6180522e836',
        },
        {
          title: 'AI assist',
          _type: 'iconAndText',
          icon: {
            url: 'https://cdn.sanity.io/images/pyrmmpch/staging/07c3155890a06dec083c304205619af7b7edfbf7-21x22.svg',
          },
          text: 'Automate your content chores',
          _key: '4681ff7dd72a',
        },
        {
          icon: {
            url: 'https://cdn.sanity.io/images/pyrmmpch/staging/07c3155890a06dec083c304205619af7b7edfbf7-21x22.svg',
          },
          text: 'Assign access control per user',
          _key: '7a40c79dc6fd',
          title: 'User roles',
          _type: 'iconAndText',
        },
        {
          text: 'Fine grain publishing controls',
          _key: '814251f1635c',
          title: 'Scheduling',
          _type: 'iconAndText',
          icon: {
            url: 'https://cdn.sanity.io/images/pyrmmpch/staging/07c3155890a06dec083c304205619af7b7edfbf7-21x22.svg',
          },
        },
      ],
      _updatedAt: '2023-12-12T07:41:41Z',
      _rev: 'Nka2T75McG1QANe0fuuDKB',
      id: 'project-downgraded-to-free',
      headingText: 'Project downgraded to Free',
      _createdAt: '2023-12-11T17:48:17Z',
    },
  },
]
