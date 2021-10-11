export const values = {
  empty: undefined,
  withContent: [
    {
      _type: 'myBlockType',
      _key: 'a',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'a1',
          text:
            "This is a custom portable text block above an empty image block! It's the block below. There should be a nice margin below me?",
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
      _key: 'd',
      _type: 'someObject',
    },
    {
      _type: 'myBlockType',
      _key: 'e',
      style: 'normal',
      markDefs: [
        {
          _key: 'abc',
          _type: 'link',
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
          text: 'annotation',
          marks: ['abc'],
        },
        {
          _type: 'span',
          _key: 'e3',
          text: ' plz?',
          marks: [],
        },
      ],
    },
    {
      _type: 'myBlockType',
      _key: 'd',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'd1',
          text:
            "This is a custom portable text block above an empty image block! It's the block below. There should be a nice margin below me?",
          marks: [],
        },
      ],
    },
    {
      _key: 'e',
      _type: 'someObject',
      title: 'Some object',
      subtitle: 'Description',
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
          text:
            "This is a custom portable text block above an empty image block! It's the block below. There should be a nice margin below me?",
          marks: [],
        },
      ],
    },
  ],
}

export const valueOptions = {Empty: 'empty', 'With custom content': 'withContent'}
