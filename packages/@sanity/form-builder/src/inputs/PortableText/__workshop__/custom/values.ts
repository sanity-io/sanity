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
          text: "Let's test the inline object here ",
          marks: [],
        },
        {
          _type: 'someObject',
          _key: 'c2',
          title: 'The Object',
        },
      ],
    },
  ],
}

export const valueOptions = {Empty: 'empty', 'With custom content': 'withContent'}
