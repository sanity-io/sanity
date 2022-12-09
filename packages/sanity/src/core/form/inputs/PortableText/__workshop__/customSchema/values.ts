import {keyGenerator as createKey} from '@sanity/portable-text-editor'
import {PortableTextBlock} from '@sanity/types'
import {words} from './words'

export const valueOptions: Record<string, 'empty' | 'withCustomContent' | 'withLargeContent'> = {
  Empty: 'empty',
  'Custom content': 'withCustomContent',
  'Large content': 'withLargeContent',
}

function genText(numWords?: number) {
  const wordsArr = Array.from(new Array(numWords || Math.floor(Math.random() * 100)))

  return wordsArr.map(randomWord).join(' ')
}

function randomWord() {
  return words[Math.floor(Math.random() * words.length)] || 'nihil'
}

export const values: Record<string, PortableTextBlock[] | undefined> = {
  empty: undefined,

  withCustomContent: [
    {
      _type: 'myBlockType',
      _key: 'e',
      style: 'normal',
      markDefs: [
        {
          _key: 'abc',
          _type: 'link',
        },
        {
          _key: 'abcd',
          _type: 'someAnnotation',
        },
      ],
      children: [
        {
          _type: 'span',
          _key: 'e1',
          text: 'Can I have ',
          marks: [],
        },
        {
          _type: 'span',
          _key: 'e2',
          text: 'link',
          marks: ['abc'],
        },
        {
          _type: 'span',
          _key: 'e3',
          text: ' ',
          marks: [],
        },
        {
          _type: 'span',
          _key: 'e4',
          text: 'someAnnotation',
          marks: ['abcd'],
        },
        {
          _type: 'span',
          _key: 'e5',
          text: ' plz?',
          marks: [],
        },
      ],
    },
    {
      _type: 'myBlockType',
      _key: 'a',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'a1',
          text: "This is a custom portable text block above an empty image block! It's the block below. There should be a nice margin below me?",
          marks: [],
        },
      ],
    },
    {
      _type: 'myBlockType',
      _key: 'c',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'c1',
          text: "Let's test the inline object ",
          marks: [],
        },
        {
          _type: 'someObject',
          _key: 'c2',
          title: 'The Object',
        },
        {
          _type: 'span',
          _key: 'c3',
          text: ' here.',
          marks: [],
        },
      ],
    },
    {
      _key: 'b',
      _type: 'blockImage',
      title: 'The Block Image Object',
    },
    {
      _key: 'd',
      _type: 'someObject',
    },
    {
      _type: 'myBlockType',
      _key: 'f',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'f1',
          text: "This is a custom portable text block above an empty image block! It's the block below. There should be a nice margin below me?",
          marks: [],
        },
      ],
    },
    {
      _key: 'g',
      _type: 'someObject',
      title: 'Some object',
      subtitle: 'Description',
    },
    {
      _type: 'myBlockType',
      _key: 'h',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'h1',
          text: "This is a custom portable text block above an empty image block! It's the block below. There should be a nice margin below me?",
          marks: [],
        },
      ],
    },
  ],

  withLargeContent: Array.from(new Array(500)).map(() => ({
    _type: 'myBlockType',
    _key: createKey(),
    style: 'normal',
    markDefs: [],
    children: [
      {
        _type: 'span',
        _key: createKey(),
        text: genText(),
        marks: [],
      },
    ],
  })),
}
