import {defineField, defineType} from 'sanity'

import {ModalObjectInput} from './components/DialogWrappedObjectInput'

export const navbarSettingsDialogRepro = defineType({
  name: 'navbarSettings',
  title: 'Navbar Settings',
  type: 'document',
  fields: [
    defineField({
      name: 'config',
      title: 'Configuration',
      type: 'object',
      components: {input: ModalObjectInput},
      fields: [
        defineField({
          name: 'links',
          title: 'Navigation Links',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                {name: 'label', type: 'string'},
                {name: 'url', type: 'string'},
              ],
            },
          ],
        }),
      ],
    }),
  ],
})
