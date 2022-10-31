import {PortableTextBlock} from '@sanity/types'

export const valueOptions = {
  Empty: 'empty',
  'With Text': 'withText',
}

export const values: Record<string, PortableTextBlock[] | undefined> = {
  empty: undefined,
  withText: [
    {
      _type: 'block',
      _key: 'a',
      style: 'normal',
      markDefs: [
        {
          _key: '123',
          _type: 'link',
        },
      ],
      children: [
        {
          _type: 'span',
          _key: 'a1',
          text: 'Lorem ipsum dolor sit amet, ',
          marks: [],
        },
        {
          _type: 'span',
          _key: 'a2',
          text: 'consectetur',
          marks: ['123'],
        },
        {
          _type: 'span',
          _key: 'a3',
          text: ' adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
          marks: [],
        },
      ],
    },
    {
      _type: 'block',
      _key: 'b',
      style: 'normal',
      markDefs: [],
      listItem: 'bullet',
      level: 1,
      children: [
        {
          _type: 'span',
          _key: 'b1',
          text: 'This is the ',
          marks: [],
        },
        {
          _type: 'span',
          _key: 'b2',
          text: 'first',
          marks: ['strong'],
        },
        {
          _type: 'span',
          _key: 'b2',
          text: ' bullet list item',
          marks: [],
        },
      ],
    },
    {
      _type: 'block',
      _key: 'c',
      style: 'normal',
      markDefs: [],
      listItem: 'bullet',
      level: 1,
      children: [
        {
          _type: 'span',
          _key: 'c1',
          text: 'This is the ',
          marks: [],
        },
        {
          _type: 'span',
          _key: 'c2',
          text: 'second',
          marks: ['strong'],
        },
        {
          _type: 'span',
          _key: 'c2',
          text: ' bullet list item',
          marks: [],
        },
      ],
    },
    {
      _type: 'block',
      _key: 'd',
      style: 'normal',
      markDefs: [],
      listItem: 'bullet',
      level: 1,
      children: [
        {
          _type: 'span',
          _key: 'd1',
          text: 'This is the ',
          marks: [],
        },
        {
          _type: 'span',
          _key: 'd2',
          text: 'third',
          marks: ['strong'],
        },
        {
          _type: 'span',
          _key: 'd2',
          text: ' bullet list item',
          marks: [],
        },
      ],
    },
    {
      _type: 'block',
      _key: 'e',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'e1',
          text: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
          marks: [],
        },
      ],
    },
  ],
}
