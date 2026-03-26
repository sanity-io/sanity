const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function getDocumentIds(id) {
  if (!id) return {draftId: null, publishedId: null}

  const publishedId = id.replace(/^drafts\./, '')
  const draftId = id.startsWith('drafts.') ? id : `drafts.${id}`

  return {draftId, publishedId}
}

async function resolveAsyncHidden(document, getClient) {
  const delayMs =
    typeof document?.asyncHiddenDelayMs === 'number' ? document.asyncHiddenDelayMs : 1500

  // Simulate an external lookup so async hidden can be tested manually in Studio.
  await wait(delayMs)

  const {draftId, publishedId} = getDocumentIds(document?._id)
  if (!publishedId) return true

  const showAsyncField = await getClient({apiVersion: '2026-03-26'}).fetch(
    `coalesce(*[_id in [$draftId, $publishedId]] | order(_updatedAt desc)[0].showAsyncField, false)`,
    {draftId, publishedId},
  )

  return !showAsyncField
}

export default {
  name: 'conditionalFieldsTest',
  type: 'document',
  title: 'Conditional fields',
  readOnly: () => false,
  fields: [
    {
      name: 'readOnly',
      title: 'Read-only',
      type: 'boolean',
    },
    {
      name: 'hidden',
      title: 'Hidden',
      type: 'boolean',
    },
    {
      name: 'title',
      type: 'string',
      description: 'Title',
    },
    {
      name: 'isPublished',
      type: 'boolean',
      description: 'Is published?',
      // readOnly: () => true,
    },
    {
      name: 'showAsyncField',
      type: 'boolean',
      title: 'Show async field',
      description:
        'Controls the async hidden examples below. Toggle this, wait for autosave, then wait for the configured delay.',
      initialValue: false,
    },
    {
      name: 'asyncHiddenDelayMs',
      type: 'number',
      title: 'Async hidden delay (ms)',
      description: 'Artificial delay used before the client lookup resolves.',
      initialValue: 1500,
    },
    {
      name: 'asyncHiddenField',
      type: 'string',
      title: 'Async hidden field',
      description:
        'This field should stay hidden while the async callback is pending, then appear only when the saved document says "Show async field" is enabled.',
      hidden: async ({document, getClient}) => resolveAsyncHidden(document, getClient),
    },
    {
      name: 'asyncHiddenObject',
      type: 'object',
      title: 'Async hidden object',
      description:
        'This object exercises subtree hiding. Its children should remain hidden until the client lookup resolves to false.',
      hidden: async ({document, getClient}) => resolveAsyncHidden(document, getClient),
      fields: [
        {
          name: 'details',
          type: 'string',
          description: 'Only visible when the async object becomes visible.',
        },
        {
          name: 'nestedField',
          type: 'string',
          description: 'Useful for verifying child fields do not flash during pending resolution.',
        },
      ],
    },
    {
      name: 'readOnlyIfTitleIsReadOnly',
      type: 'string',
      description: 'This will be read only if the document title contains the string `read only`',
      readOnly: ({document}) => {
        return Boolean(document.title && document.title.includes('read only'))
      },
    },
    {
      name: 'fieldWithObjectType',
      title: 'Field of object type',
      type: 'object',
      description: 'Becomes read-only if the readOnly is true',
      readOnly: ({document}) => {
        return Boolean(document.readOnly)
      },
      hidden: ({document}) => {
        return Boolean(document.hidden)
      },
      fields: [
        {
          name: 'readOnly',
          title: 'Read-only',
          type: 'boolean',
        },
        {
          name: 'hidden',
          title: 'Hidden',
          type: 'boolean',
        },
        {
          name: 'field1',
          type: 'string',
          description: 'Try typing "hide field 2" here',
          readOnly: true,
        },
        {
          name: 'field2',
          type: 'string',
          description: 'This will be hidden if you type "hide field 2" into field 1',
          hidden: ({parent}) => parent?.field1 === 'hide field 2',
        },
        {
          name: 'roleConditionField',
          type: 'string',
          description: 'This will be hidden unless current user has the administrator role',
          hidden: ({currentUser}) => !currentUser.roles.some((r) => r.name === 'administrator'),
        },
        {
          name: 'hiddenIfPublished',
          type: 'string',
          description: 'This will be hidden if the document is published',
          hidden: ({document}) => Boolean(document.isPublished),
        },
        {
          name: 'readOnlyIfPublished',
          type: 'string',
          description: 'This will be read only if the document is published',
          readOnly: ({document}) => document.isPublished,
        },
        {
          name: 'readOnlyIfTitleIsReadOnly',
          type: 'string',
          description:
            'This will be read only if the document title contains the string `read only`',
          readOnly: ({document}) => {
            return Boolean(document.title && document.title.toLowerCase().includes('read only'))
          },
        },
        {
          name: 'field3',
          type: 'string',
          description: 'This will be hidden if its value becomes "hideme"',
          hidden: ({value}) => value === 'hid',
        },
      ],
    },
    {
      name: 'arrayReadOnly',
      type: 'array',
      of: [{type: 'string'}, {type: 'number'}],
      readOnly: ({document}) => {
        return Boolean(document.readOnly)
      },
      hidden: ({document}) => {
        return Boolean(document.hidden)
      },
    },
    {
      name: 'myImage',
      title: 'Image type with fields',
      type: 'image',
      readOnly: ({document}) => {
        return Boolean(!document.readOnly)
      },
      fields: [
        {
          name: 'caption',
          title: 'Caption',
          type: 'string',
          readOnly: ({document}) => {
            return Boolean(document.readOnly)
          },
        },
      ],
    },
    {
      name: 'imageReadOnly',
      type: 'image',
      readOnly: ({document}) => {
        return Boolean(document.readOnly)
      },
      hidden: ({document}) => {
        return Boolean(document.hidden)
      },
    },
    {
      name: 'fileReadOnly',
      type: 'file',
      readOnly: ({document}) => {
        return Boolean(document.readOnly)
      },
      hidden: ({document}) => {
        return Boolean(document.hidden)
      },
    },
    {
      name: 'myFile',
      title: 'File type with fields',
      type: 'file',
      readOnly: ({document}) => {
        return Boolean(!document.readOnly)
      },
      fields: [
        {
          name: 'caption',
          title: 'Caption',
          type: 'string',
          readOnly: ({document}) => {
            return Boolean(document.readOnly)
          },
        },
      ],
    },
    {
      name: 'arrayOfStrings',
      title: 'Array of strings',
      description: 'This array contains only strings, with no title',
      type: 'array',
      of: [
        {
          type: 'string',
          validation: (Rule) => Rule.required().min(10).max(80),
          readOnly: ({document}) => {
            return Boolean(document.readOnly)
          },
          hidden: ({document}) => {
            return Boolean(document.hidden)
          },
        },
        {
          type: 'number',
          validation: (Rule) => Rule.required().min(10).max(80),
          readOnly: ({document}) => {
            return Boolean(!document.readOnly)
          },
          hidden: ({document}) => {
            return Boolean(!document.hidden)
          },
        },
      ],
    },
    {
      name: 'predefinedStringArray',
      title: 'Array of strings',
      type: 'array',
      readOnly: ({document}) => {
        return Boolean(document.readOnly)
      },
      hidden: ({document}) => {
        return Boolean(document.hidden)
      },
      of: [{type: 'string'}, {type: 'number'}],
      options: {
        list: [
          {title: 'Cats', value: 'cats4ever'},
          {title: 'Dogs', value: 'dogs4ever'},
          {title: 'Number', value: 0},
        ],
      },
    },
    {
      name: 'arrayOfMultipleTypes',
      title: 'Array of multiple types',
      type: 'array',
      readOnly: ({document}) => Boolean(document.readOnly),
      of: [
        {
          type: 'image',
          readOnly: () => true,
        },
        {
          type: 'book',
        },
        {
          type: 'object',
          name: 'color',
          title: 'Color with a long title',
          readOnly: () => true,
          fields: [
            {
              name: 'title',
              type: 'string',
            },
            {
              name: 'name',
              type: 'string',
            },
          ],
        },
      ],
    },
  ],
}
