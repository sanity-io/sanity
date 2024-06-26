import {SlSpeech} from 'react-icons/sl'
import {defineField, defineType} from 'sanity'

export const testimonials = defineType({
  type: 'object',
  name: 'testimonials',
  title: 'Testimonials',
  icon: SlSpeech,
  fields: [
    defineField({
      type: 'array',
      name: 'testimonials',
      title: 'Testimonials',
      of: [
        {
          type: 'reference',
          to: [{type: 'testimonial'}],
        },
      ],
    }),
  ],
  preview: {
    select: {
      testimonials: 'testimonials',
      quotee0: 'testimonials.0.quotee',
      quotee1: 'testimonials.1.quotee',
      quotee2: 'testimonials.2.quotee',
    },
    prepare({quotee0, quotee1, quotee2}) {
      const quotees = [quotee0, quotee1].filter(Boolean)
      const subtitle = quotees.length > 0 ? quotees.join(', ') : ''
      const hasMore = Boolean(quotee2)

      return {
        title: 'Testimonials',
        subtitle: hasMore ? `${subtitle}...` : subtitle,
      }
    },
  },
})

export const testimonial = defineType({
  type: 'document',
  name: 'testimonial',
  title: 'Testimonial',
  icon: SlSpeech,
  fields: [
    defineField({
      type: 'array',
      name: 'quote',
      title: 'Quote',
      of: [{type: 'block'}],
    }),
    defineField({
      type: 'string',
      name: 'quotee',
      title: 'Quotee',
    }),
    defineField({
      type: 'string',
      name: 'jobTitle',
      title: 'Job Title',
    }),
  ],
})
