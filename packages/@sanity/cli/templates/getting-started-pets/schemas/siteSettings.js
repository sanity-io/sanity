import S from '@sanity/desk-tool/structure-builder'
import {CharacterCount} from '../components/inputs/CharacterCount'
import {JsonView} from '../components/views/JsonView'
import {SocialMediaView} from '../components/views/SocialMediaView'
import {CogIcon, DocumentIcon, EyeOpenIcon} from '@sanity/icons'

export default {
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  icon: CogIcon,
  preview: {
    select: {
      title: 'title',
    },
    prepare(selection) {
      const {title} = selection
      return {
        title: title,
      }
    },
  },
  __experimental_actions: ['create', 'update', /*'delete',*/ 'publish'],
  views: [
    S.view.component(SocialMediaView).title('Preview').icon(EyeOpenIcon),
    S.view.component(JsonView).title('JSON').icon(DocumentIcon),
  ],
  groups: [
    {
      name: 'seo',
      title: 'SEO & metadata',
    },
  ],
  fields: [
    {
      name: 'title',
      description: 'This field is the title of your application.',
      title: 'Title',
      type: 'string',
      group: 'seo',
    },
    {
      name: 'description',
      title: 'SEO Description',
      type: 'text',
      description:
        "This field is the description of your application! It's suited for simple, and direct (SEO-focused) text. If you need markup and structured data, use block text, as the next field below 👇",
      inputComponent: CharacterCount,
      validation: (Rule) =>
        Rule.max(150).warning(
          'Shorter is usually better for SEO purposes. Try to keep it under 150 characters.'
        ),
      group: 'seo',
    },
    {
      name: 'blurb',
      title: 'Blurb',
      description:
        'This field allows you to compose rich text. The big difference between this field and the rest is the level of customization (rich text) allowed. You can also customize and extend it further with React components.',
      type: 'array',
      of: [{type: 'block'}],
    },
    {
      name: 'logo',
      description:
        'This is a simple image field. You can add as many custom fields to it as you need (such as description, author, or alt text).',
      title: 'Logo',
      type: 'image',
      fields: [
        {
          name: 'caption',
          type: 'string',
          title: 'Alt text',
          options: {
            isHighlighted: true, // <-- make this field easily accessible
          },
        },
      ],
    },
    {
      name: 'ogimage',
      description:
        'This image is used in three different use cases and sizes (Twitter, Twitter desktop and Facebook banner). Edit to adjust the crop & hotspot of the image. Hit the 👉 Preview 👈 tab to see how it performs in different sizes. Recommended size: 1200x630px.',
      title: 'OG Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      group: 'seo',
    },
    {
      name: 'socialMedia',
      description:
        'This is an array of references. References allow you to connect different documents without leaving the current document. Referenced documents are independent, but you can add and edit them directly from here.',
      title: 'Social media',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'link'}]}],
    },
  ],
}
