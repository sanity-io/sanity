import {IntentLink} from 'sanity/router'

export const issue4516AddFilterIntentLink = {
  name: 'issue4516AddFilterIntentLink',
  type: 'document',
  title: 'IntentLink description for search breaking',
  description:
    'Repro for https://github.com/sanity-io/sanity/issues/4516. Open Search, click "+ Add filter", and scroll to this type/field.',
  fields: [
    {
      name: 'title',
      title: 'Title',
      description: (
        <>
          {'Tags must first be '}
          <IntentLink intent="create" params={{type: 'author'}} target="_blank">
            created and published
          </IntentLink>{' '}
          {'before they can be referenced here.'}
        </>
      ),
      type: 'string',
    },
    {
      name: 'notes',
      title: 'Notes',
      type: 'text',
    },
  ],
}
