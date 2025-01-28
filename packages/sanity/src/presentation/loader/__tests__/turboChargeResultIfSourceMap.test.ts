import {type ContentSourceMap} from '@sanity/client'
import {expect, test} from 'vitest'

import {turboChargeResultIfSourceMap} from '../LiveQueries'

const perspective = 'previewDrafts'

test('Can apply an array keyed field update', () => {
  const result = {
    page: {
      _type: 'page',
      _id: 'drafts.home',
      title: 'Home',
      sections: [
        {
          symbol: null,
          products: null,
          _type: 'hero',
          tagline: 'ACME’s elegant construction is both minimal and inviting.',
          headline: 'Touch of Texture ',
          subline: 'You can follow us on Twitter, Twitch, LinkedIn, and GitHub.',
          style: {
            _type: 'sectionStyle',
            variant: 'default',
          },
          _key: '44540ccd70c3',
          product: null,
        },
        {
          headline: 'Duplicate',
          product: null,
          products: null,
          _type: 'hero',
          _key: '50692538e3551f1805206202c8838ea5',
          subline: 'You can follow us on Twitter, Twitch, LinkedIn, and GitHub..',
          symbol: null,
          tagline: 'ACME’s elegant construction is both minimal and inviting.',
          style: {
            _type: 'sectionStyle',
            variant: 'default',
          },
        },
        {
          product: {
            _type: 'product',
            _id: 'drafts.462efcc6-3c8b-47c6-8474-5544e1a4acde',
            title: 'Akoya',
            slug: {
              current: 'akoya',
              _type: 'slug',
            },
            media: {
              _type: 'image',
              _key: 'cee5fbb69da2',
              asset: {
                _ref: 'image-a75b03fdd5b5fa36947bf2b776a542e0c940f682-1000x1500-jpg',
                _type: 'reference',
              },
            },
          },
          description:
            'ACME partnered with industrial designer Jonas Damon to create Highline, an adaptable, easy-to-install system that marries the flexibility of a linear fixture with the thoughtful design of a pendant.',
          style: {
            _type: 'sectionStyle',
            variant: 'default',
          },
          _key: '6b875593a9e1',
          symbol: null,
          _type: 'featureHighlight',
          ctas: [
            {
              _key: '53685454c2c9',
              title: 'Explore highline',
              _type: 'cta',
              href: '/highline',
            },
          ],
          headline: 'Highlines',
          image: {
            _type: 'image',
            asset: {
              _ref: 'image-9d18bc376926c8e0b27a71adf95002d64ef65684-2200x2500-jpg',
              _type: 'reference',
            },
          },
          tagline: null,
          subline: null,
          products: null,
        },
        {
          _key: 'e77f7c827ba4',
          headline: 'Some Featured Products Here',
          tagline: null,
          subline: null,
          product: null,
          products: [
            {
              slug: {
                _type: 'slug',
                current: 'ripple-sconce',
              },
              media: {
                _key: 'c51dda81eb69',
                asset: {
                  _ref: 'image-9d18bc376926c8e0b27a71adf95002d64ef65684-2200x2500-jpg',
                  _type: 'reference',
                },
                _type: 'image',
              },
              _key: 'drafts.e1bf9f1f-efdb-4105-8c26-6b64f897e9c1',
              _type: 'product',
              _id: 'drafts.e1bf9f1f-efdb-4105-8c26-6b64f897e9c1',
              title: 'Ripple Sconce',
            },
            {
              media: {
                _type: 'image',
                _key: 'cee5fbb69da2',
                asset: {
                  _ref: 'image-a75b03fdd5b5fa36947bf2b776a542e0c940f682-1000x1500-jpg',
                  _type: 'reference',
                },
              },
              _key: 'drafts.462efcc6-3c8b-47c6-8474-5544e1a4acde',
              _type: 'product',
              _id: 'drafts.462efcc6-3c8b-47c6-8474-5544e1a4acde',
              title: 'Akoya',
              slug: {
                current: 'akoya',
                _type: 'slug',
              },
            },
            {
              media: {
                _type: 'image',
                _key: '55659c72ec46',
                asset: {
                  _ref: 'image-c46098d15d7e75080ba279c09f2ea88f24736eb0-1000x1500-jpg',
                  _type: 'reference',
                },
              },
              _key: 'drafts.807cc05c-8c4c-443a-a9c1-198fd3fd7b16',
              _type: 'product',
              _id: 'drafts.807cc05c-8c4c-443a-a9c1-198fd3fd7b16',
              title: 'All sew',
              slug: {
                _type: 'slug',
                current: 'all-sew',
              },
            },
          ],
          _type: 'featuredProducts',
          style: {
            _type: 'sectionStyle',
            variant: 'default',
          },
          symbol: null,
        },
        {
          style: {
            _type: 'sectionStyle',
            variant: 'default',
          },
          headline: 'Look at the person walking on this dune!',
          tagline: null,
          _key: '0bd049fc047a',
          symbol: null,
          subline: null,
          product: null,
          products: null,
          image: {
            _type: 'image',
            asset: {
              _ref: 'image-97bdac62b5809e77b80831823de7e8ff8cd20b43-8640x5760-jpg',
              _type: 'reference',
            },
          },
          _type: 'featureHighlight',
          description: 'Lalala',
        },
      ],
      style: null,
    },
    siteSettings: {
      title: 'ACME',
      copyrightText: 'ACME © 2023 — All Rights Reserved',
    },
  }
  const resultSourceMap = {
    documents: [
      {
        _id: 'drafts.home',
        _type: 'page',
      },
      {
        _id: 'drafts.462efcc6-3c8b-47c6-8474-5544e1a4acde',
        _type: 'product',
      },
      {
        _id: 'drafts.e1bf9f1f-efdb-4105-8c26-6b64f897e9c1',
        _type: 'product',
      },
      {
        _id: 'drafts.807cc05c-8c4c-443a-a9c1-198fd3fd7b16',
        _type: 'product',
      },
      {
        _id: 'drafts.siteSettings',
        _type: 'siteSettings',
      },
    ],
    paths: [
      "$['_type']",
      "$['_id']",
      "$['title']",
      "$['sections'][?(@._key=='44540ccd70c3')]['style']",
      "$['sections'][?(@._key=='44540ccd70c3')]['_key']",
      "$['sections'][?(@._key=='44540ccd70c3')]['_type']",
      "$['sections'][?(@._key=='44540ccd70c3')]['tagline']",
      "$['sections'][?(@._key=='44540ccd70c3')]['headline']",
      "$['sections'][?(@._key=='44540ccd70c3')]['subline']",
      "$['sections'][?(@._key=='50692538e3551f1805206202c8838ea5')]['_type']",
      "$['sections'][?(@._key=='50692538e3551f1805206202c8838ea5')]['_key']",
      "$['sections'][?(@._key=='50692538e3551f1805206202c8838ea5')]['headline']",
      "$['sections'][?(@._key=='50692538e3551f1805206202c8838ea5')]['tagline']",
      "$['sections'][?(@._key=='50692538e3551f1805206202c8838ea5')]['style']",
      "$['sections'][?(@._key=='50692538e3551f1805206202c8838ea5')]['subline']",
      "$['slug']",
      "$['media'][?(@._key=='cee5fbb69da2')]",
      "$['sections'][?(@._key=='6b875593a9e1')]['description']",
      "$['sections'][?(@._key=='6b875593a9e1')]['style']",
      "$['sections'][?(@._key=='6b875593a9e1')]['_key']",
      "$['sections'][?(@._key=='6b875593a9e1')]['_type']",
      "$['sections'][?(@._key=='6b875593a9e1')]['ctas']",
      "$['sections'][?(@._key=='6b875593a9e1')]['headline']",
      "$['sections'][?(@._key=='6b875593a9e1')]['image']",
      "$['sections'][?(@._key=='e77f7c827ba4')]['_key']",
      "$['sections'][?(@._key=='e77f7c827ba4')]['headline']",
      "$['media'][?(@._key=='c51dda81eb69')]",
      "$['media'][?(@._key=='55659c72ec46')]",
      "$['sections'][?(@._key=='e77f7c827ba4')]['_type']",
      "$['sections'][?(@._key=='e77f7c827ba4')]['style']",
      "$['sections'][?(@._key=='0bd049fc047a')]['_type']",
      "$['sections'][?(@._key=='0bd049fc047a')]['description']",
      "$['sections'][?(@._key=='0bd049fc047a')]['_key']",
      "$['sections'][?(@._key=='0bd049fc047a')]['image']",
      "$['sections'][?(@._key=='0bd049fc047a')]['headline']",
      "$['sections'][?(@._key=='0bd049fc047a')]['style']",
      "$['copyrightText']",
    ],
    mappings: {
      "$['page']['_id']": {
        source: {
          document: 0,
          path: 1,
          type: 'documentValue',
        },
        type: 'value',
      },
      "$['page']['_type']": {
        source: {
          document: 0,
          path: 0,
          type: 'documentValue',
        },
        type: 'value',
      },
      "$['page']['sections'][0]['_key']": {
        source: {
          document: 0,
          path: 4,
          type: 'documentValue',
        },
        type: 'value',
      },
      "$['page']['sections'][0]['_type']": {
        source: {
          document: 0,
          path: 5,
          type: 'documentValue',
        },
        type: 'value',
      },
      "$['page']['sections'][0]['headline']": {
        source: {
          document: 0,
          path: 7,
          type: 'documentValue',
        },
        type: 'value',
      },
      "$['page']['sections'][0]['style']": {
        source: {
          document: 0,
          path: 3,
          type: 'documentValue',
        },
        type: 'value',
      },
      "$['page']['sections'][0]['subline']": {
        source: {
          document: 0,
          path: 8,
          type: 'documentValue',
        },
        type: 'value',
      },
      "$['page']['sections'][0]['tagline']": {
        source: {
          document: 0,
          path: 6,
          type: 'documentValue',
        },
        type: 'value',
      },
      "$['page']['sections'][1]['_key']": {
        source: {
          document: 0,
          path: 10,
          type: 'documentValue',
        },
        type: 'value',
      },
      "$['page']['sections'][1]['_type']": {
        source: {
          document: 0,
          path: 9,
          type: 'documentValue',
        },
        type: 'value',
      },
      "$['page']['sections'][1]['headline']": {
        source: {
          document: 0,
          path: 11,
          type: 'documentValue',
        },
        type: 'value',
      },
      "$['page']['sections'][1]['style']": {
        source: {
          document: 0,
          path: 13,
          type: 'documentValue',
        },
        type: 'value',
      },
      "$['page']['sections'][1]['subline']": {
        source: {
          document: 0,
          path: 14,
          type: 'documentValue',
        },
        type: 'value',
      },
      "$['page']['sections'][1]['tagline']": {
        source: {
          document: 0,
          path: 12,
          type: 'documentValue',
        },
        type: 'value',
      },
      "$['page']['sections'][2]['_key']": {
        source: {
          document: 0,
          path: 19,
          type: 'documentValue',
        },
        type: 'value',
      },
      "$['page']['sections'][2]['_type']": {
        source: {
          document: 0,
          path: 20,
          type: 'documentValue',
        },
        type: 'value',
      },
      "$['page']['sections'][2]['ctas']": {
        source: {
          document: 0,
          path: 21,
          type: 'documentValue',
        },
        type: 'value',
      },
      "$['page']['sections'][2]['description']": {
        source: {
          document: 0,
          path: 17,
          type: 'documentValue',
        },
        type: 'value',
      },
      "$['page']['sections'][2]['headline']": {
        source: {
          document: 0,
          path: 22,
          type: 'documentValue',
        },
        type: 'value',
      },
      "$['page']['sections'][2]['image']": {
        source: {
          document: 0,
          path: 23,
          type: 'documentValue',
        },
        type: 'value',
      },
      "$['page']['sections'][2]['product']['_id']": {
        source: {
          document: 1,
          path: 1,
          type: 'documentValue',
        },
        type: 'value',
      },
      "$['page']['sections'][2]['product']['_type']": {
        source: {
          document: 1,
          path: 0,
          type: 'documentValue',
        },
        type: 'value',
      },
      "$['page']['sections'][2]['product']['media']": {
        source: {
          document: 1,
          path: 16,
          type: 'documentValue',
        },
        type: 'value',
      },
      "$['page']['sections'][2]['product']['slug']": {
        source: {
          document: 1,
          path: 15,
          type: 'documentValue',
        },
        type: 'value',
      },
      "$['page']['sections'][2]['product']['title']": {
        source: {
          document: 1,
          path: 2,
          type: 'documentValue',
        },
        type: 'value',
      },
      "$['page']['sections'][2]['style']": {
        source: {
          document: 0,
          path: 18,
          type: 'documentValue',
        },
        type: 'value',
      },
      "$['page']['sections'][3]['_key']": {
        source: {
          document: 0,
          path: 24,
          type: 'documentValue',
        },
        type: 'value',
      },
      "$['page']['sections'][3]['_type']": {
        source: {
          document: 0,
          path: 28,
          type: 'documentValue',
        },
        type: 'value',
      },
      "$['page']['sections'][3]['headline']": {
        source: {
          document: 0,
          path: 25,
          type: 'documentValue',
        },
        type: 'value',
      },
      "$['page']['sections'][3]['products'][0]['_id']": {
        source: {
          document: 2,
          path: 1,
          type: 'documentValue',
        },
        type: 'value',
      },
      "$['page']['sections'][3]['products'][0]['_key']": {
        source: {
          document: 2,
          path: 1,
          type: 'documentValue',
        },
        type: 'value',
      },
      "$['page']['sections'][3]['products'][0]['_type']": {
        source: {
          document: 2,
          path: 0,
          type: 'documentValue',
        },
        type: 'value',
      },
      "$['page']['sections'][3]['products'][0]['media']": {
        source: {
          document: 2,
          path: 26,
          type: 'documentValue',
        },
        type: 'value',
      },
      "$['page']['sections'][3]['products'][0]['slug']": {
        source: {
          document: 2,
          path: 15,
          type: 'documentValue',
        },
        type: 'value',
      },
      "$['page']['sections'][3]['products'][0]['title']": {
        source: {
          document: 2,
          path: 2,
          type: 'documentValue',
        },
        type: 'value',
      },
      "$['page']['sections'][3]['products'][1]['_id']": {
        source: {
          document: 1,
          path: 1,
          type: 'documentValue',
        },
        type: 'value',
      },
      "$['page']['sections'][3]['products'][1]['_key']": {
        source: {
          document: 1,
          path: 1,
          type: 'documentValue',
        },
        type: 'value',
      },
      "$['page']['sections'][3]['products'][1]['_type']": {
        source: {
          document: 1,
          path: 0,
          type: 'documentValue',
        },
        type: 'value',
      },
      "$['page']['sections'][3]['products'][1]['media']": {
        source: {
          document: 1,
          path: 16,
          type: 'documentValue',
        },
        type: 'value',
      },
      "$['page']['sections'][3]['products'][1]['slug']": {
        source: {
          document: 1,
          path: 15,
          type: 'documentValue',
        },
        type: 'value',
      },
      "$['page']['sections'][3]['products'][1]['title']": {
        source: {
          document: 1,
          path: 2,
          type: 'documentValue',
        },
        type: 'value',
      },
      "$['page']['sections'][3]['products'][2]['_id']": {
        source: {
          document: 3,
          path: 1,
          type: 'documentValue',
        },
        type: 'value',
      },
      "$['page']['sections'][3]['products'][2]['_key']": {
        source: {
          document: 3,
          path: 1,
          type: 'documentValue',
        },
        type: 'value',
      },
      "$['page']['sections'][3]['products'][2]['_type']": {
        source: {
          document: 3,
          path: 0,
          type: 'documentValue',
        },
        type: 'value',
      },
      "$['page']['sections'][3]['products'][2]['media']": {
        source: {
          document: 3,
          path: 27,
          type: 'documentValue',
        },
        type: 'value',
      },
      "$['page']['sections'][3]['products'][2]['slug']": {
        source: {
          document: 3,
          path: 15,
          type: 'documentValue',
        },
        type: 'value',
      },
      "$['page']['sections'][3]['products'][2]['title']": {
        source: {
          document: 3,
          path: 2,
          type: 'documentValue',
        },
        type: 'value',
      },
      "$['page']['sections'][3]['style']": {
        source: {
          document: 0,
          path: 29,
          type: 'documentValue',
        },
        type: 'value',
      },
      "$['page']['sections'][4]['_key']": {
        source: {
          document: 0,
          path: 32,
          type: 'documentValue',
        },
        type: 'value',
      },
      "$['page']['sections'][4]['_type']": {
        source: {
          document: 0,
          path: 30,
          type: 'documentValue',
        },
        type: 'value',
      },
      "$['page']['sections'][4]['description']": {
        source: {
          document: 0,
          path: 31,
          type: 'documentValue',
        },
        type: 'value',
      },
      "$['page']['sections'][4]['headline']": {
        source: {
          document: 0,
          path: 34,
          type: 'documentValue',
        },
        type: 'value',
      },
      "$['page']['sections'][4]['image']": {
        source: {
          document: 0,
          path: 33,
          type: 'documentValue',
        },
        type: 'value',
      },
      "$['page']['sections'][4]['style']": {
        source: {
          document: 0,
          path: 35,
          type: 'documentValue',
        },
        type: 'value',
      },
      "$['page']['title']": {
        source: {
          document: 0,
          path: 2,
          type: 'documentValue',
        },
        type: 'value',
      },
      "$['siteSettings']['copyrightText']": {
        source: {
          document: 4,
          path: 36,
          type: 'documentValue',
        },
        type: 'value',
      },
      "$['siteSettings']['title']": {
        source: {
          document: 4,
          path: 2,
          type: 'documentValue',
        },
        type: 'value',
      },
    },
  } satisfies ContentSourceMap
  // In this draft the headline "Touch of Texture 1" is changed
  const draft = {
    _createdAt: '2023-06-27T14:35:36Z',
    _id: 'drafts.home',
    _rev: '3b8d3273-43ec-471c-9629-1ab5e0e894fa',
    _type: 'page',
    _updatedAt: '2023-10-26T13:22:12.692Z',
    sections: [
      {
        _key: '44540ccd70c3',
        _type: 'hero',
        headline: 'Touch of Texture 1',
        style: {
          _type: 'sectionStyle',
          variant: 'default',
        },
        subline: 'You can follow us on Twitter, Twitch, LinkedIn, and GitHub.',
        tagline: 'ACME’s elegant construction is both minimal and inviting.',
      },
      {
        _key: '50692538e3551f1805206202c8838ea5',
        _type: 'hero',
        headline: 'Duplicate',
        style: {
          _type: 'sectionStyle',
          variant: 'default',
        },
        subline: 'You can follow us on Twitter, Twitch, LinkedIn, and GitHub..',
        tagline: 'ACME’s elegant construction is both minimal and inviting.',
      },
      {
        _key: '6b875593a9e1',
        _type: 'featureHighlight',
        ctas: [
          {
            _key: '53685454c2c9',
            _type: 'cta',
            href: '/highline',
            title: 'Explore highline',
          },
        ],
        description:
          'ACME partnered with industrial designer Jonas Damon to create Highline, an adaptable, easy-to-install system that marries the flexibility of a linear fixture with the thoughtful design of a pendant.',
        headline: 'Highlines',
        image: {
          _type: 'image',
          asset: {
            _ref: 'image-9d18bc376926c8e0b27a71adf95002d64ef65684-2200x2500-jpg',
            _type: 'reference',
          },
        },
        product: {
          _ref: '462efcc6-3c8b-47c6-8474-5544e1a4acde',
          _type: 'reference',
        },
        style: {
          _type: 'sectionStyle',
          variant: 'default',
        },
      },
      {
        _key: 'e77f7c827ba4',
        _type: 'featuredProducts',
        headline: 'Some Featured Products Here',
        products: [
          {
            _key: '2152e6edd551',
            _ref: 'e1bf9f1f-efdb-4105-8c26-6b64f897e9c1',
            _type: 'reference',
          },
          {
            _key: 'e4e0ade0a4a8',
            _ref: '462efcc6-3c8b-47c6-8474-5544e1a4acde',
            _type: 'reference',
          },
          {
            _key: '5bdb67c793ae',
            _ref: '807cc05c-8c4c-443a-a9c1-198fd3fd7b16',
            _type: 'reference',
          },
        ],
        style: {
          _type: 'sectionStyle',
          variant: 'default',
        },
      },
      {
        _key: '0bd049fc047a',
        _type: 'featureHighlight',
        description: 'Lalala',
        headline: 'Look at the person walking on this dune!',
        image: {
          _type: 'image',
          asset: {
            _ref: 'image-97bdac62b5809e77b80831823de7e8ff8cd20b43-8640x5760-jpg',
            _type: 'reference',
          },
        },
        style: {
          _type: 'sectionStyle',
          variant: 'default',
        },
      },
    ],
    title: 'Home',
  }

  const turboCharged = turboChargeResultIfSourceMap(draft, result, perspective, resultSourceMap)
  expect(result.page.sections[0].headline).not.toBe(draft.sections[0].headline)
  expect(turboCharged.page.sections[0].headline).toBe(draft.sections[0].headline)
})
