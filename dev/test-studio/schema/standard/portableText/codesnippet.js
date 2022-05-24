export default {
  name: 'codeinputdebug',
  title: 'Code Input test',
  type: 'document',
  fields: [
    {
      name: 'content',
      title: 'Content',
      type: 'array',
      of: [
        {
          type: 'block',
          marks: {
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'External link',
                fields: [
                  {
                    name: 'href',
                    type: 'url',
                    title: 'URL',
                  },
                ],
              },
            ],
            decorators: [
              {title: 'Strong', value: 'strong'},
              {title: 'Underline', value: 'underline'},
              {title: 'Strike', value: 'strike-through'},
            ],
          },
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'H2', value: 'h2'},
            {title: 'H3', value: 'h3'},
            {title: 'H4', value: 'h4'},
            {title: 'Quote', value: 'blockquote'},
          ],
        },
        {
          name: 'codesnippet',
          title: 'Code snippet',
          type: 'code',
          options: {
            language: 'js',
            withFilename: true,
            languageAlternatives: [
              {title: 'JavaScript', value: 'javascript'},
              {title: 'Rust', value: 'rust', mode: 'rust'},
              {title: 'C++', value: 'cpp', mode: 'c_cpp'},
            ],
          },
        },
      ],
    },
  ],
}
