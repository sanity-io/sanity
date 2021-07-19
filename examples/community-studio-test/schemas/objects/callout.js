export default {
  name: 'callout',
  title: 'Callout',
  type: 'object',
  fields: [
    {
      name: 'calloutType',
      title: 'Callout type',
      description: 'Defines the icon and color of the callout in the website. Defaults to "Protip"',
      type: 'string',
      options: {
        list: [
          {
            value: 'protip',
            title: 'Protip (green)'
          },
          {
            value: 'gotcha',
            title: 'Gotcha (yellow)'
          },
          {
            value: 'example',
            title: 'Example (gray)'
          },
        ]
      }
    },
    {
      name: 'body',
      title: 'Content/body of the callout',
      type: 'simpleBlockContent',
      validation: Rule => Rule.required(),
    },
  ],
}