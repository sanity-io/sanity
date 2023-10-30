import {MatchResult, RouterNode} from '../types'
import {_findMatchingRoutes} from '../_findMatchingRoutes'

const node: RouterNode = {
  route: {
    raw: '/foo/:bar',
    segments: [
      {type: 'dir', name: 'foo'},
      {type: 'param', name: 'bar'},
    ],
  },
  children: [
    {
      route: {
        raw: '/nix/:animal',
        segments: [
          {type: 'dir', name: 'nix'},
          {type: 'param', name: 'animal'},
        ],
      },
      children: [],
    },
    {
      route: {
        raw: '/qux/:animal',
        segments: [
          {type: 'dir', name: 'qux'},
          {type: 'param', name: 'animal'},
        ],
        transform: {
          animal: {
            toState: (value) => ({name: value.toUpperCase()}),
            toPath: (animal) => (animal.name as string).toLowerCase(),
          },
        },
      },
      children: [
        {
          route: {
            raw: 'flargh/:snargh',
            segments: [
              {type: 'dir', name: 'flargh'},
              {type: 'param', name: 'snargh'},
            ],
            transform: {},
          },
          children: [],
        },
      ],
    },
  ],
}

const examples: [Record<string, unknown>, MatchResult][] = [
  [
    {},
    {
      type: 'error',
      node,
      missingKeys: ['bar'],
      unmappableStateKeys: [],
    },
  ],
  [
    {bar: 'bar'},
    {
      type: 'ok',
      node: node,
      matchedState: {bar: 'bar'},
      child: undefined,
      searchParams: [],
    },
  ],
  [
    {bar: 'bar', animal: 'cat'},
    {
      node,
      type: 'ok',
      child: {
        type: 'ok',
        child: undefined,
        matchedState: {
          animal: 'cat',
        },
        node: expect.objectContaining({children: expect.any(Object), route: expect.any(Object)}),
        searchParams: [],
      },
      matchedState: {
        bar: 'bar',
      },
      searchParams: [],
    },
  ],
  [
    {bar: 'bar', animal: 'cat', snargh: 'gnargh'},
    {
      type: 'ok',
      node,
      child: {
        type: 'ok',
        child: expect.any(Object),
        matchedState: {
          animal: 'cat',
        },
        node: expect.objectContaining({children: expect.any(Object), route: expect.any(Object)}),
        searchParams: [],
      },
      matchedState: {
        bar: 'bar',
      },
      searchParams: [],
    },
  ],
  [
    {bar: 'bar', creature: 'cat'},
    {
      type: 'error',
      node,
      unmappableStateKeys: ['creature'],
      missingKeys: [],
    },
  ],
]

examples.forEach(([state, result]) => {
  test(`state ${JSON.stringify(state)} matches`, () => {
    expect(_findMatchingRoutes(node, state)).toEqual(result)
  })
})
