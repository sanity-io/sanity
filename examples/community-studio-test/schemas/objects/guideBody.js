export default {
  name: 'guideBody',
  type: 'array',
  title: 'Guide content',
  of: [
    {
      type: 'block',
      styles: [
        {title: 'Normal', value: 'normal'},
        {title: 'Heading 2', value: 'h2'},
        {title: 'Heading 3', value: 'h3'},
        {title: 'Quote', value: 'blockquote'},
      ],
    },
    {
      type: 'image',
      fields: [
        {
          name: 'caption',
          title: 'Visible caption below the image',
          type: 'string',
          options: {
            isHighlighted: true,
          },
        },
        {
          name: 'alt',
          title: 'Alternative text for screen readers',
          description: '⚡ Optional but highly encouraged to help make the content more accessible',
          type: 'string',
          options: {
            isHighlighted: true,
          },
        },
      ],
      options: {
        storeOriginalFilename: false,
      },
    },
    {
      type: 'youtube',
    },
    {
      title: 'Code block',
      type: 'code',
    },
    {
      type: 'callout',
    },
    // Types carried from admin.sanity.io that shouldn't be available:
    // (uncomment them when editing these migrated documents)
    // {
    //   type: 'youtube',
    //   name: 'youtubePlaylist',
    //   readOnly: true
    // },
    // @TODO: migrate all ui.screenshot blocks to plain image
    // {
    //   type: 'youtube',
    //   name: 'ui.screenshot',
    //   readOnly: true
    // },
    // {
    //   type: 'youtube',
    //   name: 'codesandbox',
    //   readOnly: true
    // },
    // {
    //   type: 'youtube',
    //   name: 'starterTemplates',
    //   readOnly: true
    // },
  ],
};
