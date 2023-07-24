import {defineType} from 'sanity'

const faqItem = {
  name: 'faqItem',
  title: 'FAQ Item',
  type: 'object',
  fields: [
    {
      name: 'question',
      title: 'Question',
      type: 'string',
    },
    {
      name: 'answer',
      title: 'Answer',
      type: 'array',
      of: [{type: 'block'}],
    },
  ],
}

export const virtualizationInObject = defineType({
  name: 'virtualizationInObject',
  title: 'Virtualization in Object',
  type: 'document',
  fieldsets: [
    {
      name: 'faq',
      title: 'FAQ',
      options: {
        collapsible: true,
        collapsed: true,
      },
    },
  ],
  fields: [
    {
      name: 'internalTitle',
      title: 'Internal title',
      description:
        "Descriptive title used to identify different versions of the pricing copy internally - doesn't get exposed to users.",
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      description: 'Title for /pricing',
      name: 'pageTitle',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'internalTitle1',
      title: 'Internal title',
      description:
        "Descriptive title used to identify different versions of the pricing copy internally - doesn't get exposed to users.",
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      description: 'Title for /pricing',
      name: 'pageTitle1',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'internalTitle2',
      title: 'Internal title',
      description:
        "Descriptive title used to identify different versions of the pricing copy internally - doesn't get exposed to users.",
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      description: 'Title for /pricing',
      name: 'pageTitle2',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'faqTitle',
      fieldset: 'faq',
      title: 'Pricing FAQ Title',
      type: 'string',
    },
    {
      name: 'faqs',
      fieldset: 'faq',
      title: 'Pricing FAQs',
      type: 'array',
      of: [faqItem],
    },
  ],
})
