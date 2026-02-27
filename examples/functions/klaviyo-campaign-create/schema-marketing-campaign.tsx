import {defineField, defineType} from 'sanity'

export const marketingCampaignType = defineType({
  name: 'marketingCampaign',
  title: 'Marketing Campaign',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    }),
    defineField({
      name: 'email',
      title: 'Email Content',
      type: 'reference',
      to: [{type: 'emails'}],
      validation: (Rule: any) => Rule.required(),
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          {title: 'Draft', value: 'draft'},
          {title: 'Ready (will trigger Klaviyo Send)', value: 'ready'},
          {title: 'Sent', value: 'sent'},
        ],
      },
      validation: (Rule: any) => Rule.required(),
      initialValue: 'draft',
    }),
    defineField({
      name: 'klaviyoTemplateId',
      title: 'Klaviyo Template ID',
      type: 'string',
      description: 'The template ID from Klaviyo',
      validation: (Rule: any) => Rule.required(),
    }),
    defineField({
      name: 'klaviyoCampaignId',
      title: 'Klaviyo Campaign ID',
      type: 'string',
      description: 'The campaign ID from Klaviyo',
      validation: (Rule: any) => Rule.required(),
    }),
    defineField({
      name: 'updatedAt',
      title: 'Last Updated',
      type: 'datetime',
      validation: (Rule: any) => Rule.required(),
    }),
    defineField({
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
      validation: (Rule: any) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'string',
      description: 'A description of this marketing campaign',
    }),
  ],
})
