export const blockContent = {
  name: 'blockContent',
  type: 'array',
  title: 'Content',
  of: [
    {
      title: 'Block',
      type: 'block',
    },
    {
      name: 'video',
      title: 'A video embed',
      type: 'videoEmbed',
    },
    {
      type: 'code',
      title: 'Code example',
      description: 'Code',
    },
    {
      type: 'protein',
      title: 'Protein',
      description: 'Protein',
    },
    {
      title: 'Image',
      type: 'image',
      fields: [
        {
          name: 'caption',
          type: 'string',
          title: 'Caption',
        },
      ],
    },
  ],
}
