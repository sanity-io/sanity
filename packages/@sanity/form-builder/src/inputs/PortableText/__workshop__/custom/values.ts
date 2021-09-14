export const values = {
  empty: undefined,
  withEmptyImageBlock: [
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
  ],
}

export const valueOptions = {Empty: 'empty', 'Empty image block': 'withEmptyImageBlock'}
