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
      nodes: [],
      missing: ['bar'],
      remaining: [],
    },
  ],
  [
    {bar: 'bar'},
    {
      nodes: [node],
      missing: [],
      remaining: [],
    },
  ],
  [
    {bar: 'bar', animal: 'cat'},
    {
      nodes: [node, (node.children as RouterNode[])[0]],
      remaining: [],
      missing: [],
    },
  ],
  [
    {bar: 'bar', animal: 'cat', snargh: 'gnargh'},
    {
      nodes: [
        node,
        (node.children as RouterNode[])[1],
        ((node.children as RouterNode[])[1].children as RouterNode[])[0],
      ],
      remaining: [],
      missing: [],
    },
  ],
  [
    {bar: 'bar', creature: 'cat'},
    {
      nodes: [],
      remaining: ['creature'],
      missing: [],
    },
  ],
]

examples.forEach(([state, result]) => {
  test(`state ${JSON.stringify(state)} matches`, () => {
    expect(_findMatchingRoutes(node, state)).toEqual(result)
  })
})
