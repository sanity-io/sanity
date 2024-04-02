import {TagIcon} from '@sanity/icons'
import {defineField} from 'sanity'

export const linkProductType = defineField({
  title: 'Product',
  name: 'linkProduct',
  type: 'object',
  icon: TagIcon,
  components: {
    annotation: (props) => (
      <span>
        <TagIcon
          style={{
            marginLeft: '0.05em',
            marginRight: '0.1em',
            width: '0.75em',
          }}
        />
        {props.renderDefault(props)}
      </span>
    ),
  },
  fields: [
    defineField({
      name: 'productWithVariant',
      type: 'productWithVariant',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'linkAction',
      type: 'string',
      initialValue: 'link',
      options: {
        layout: 'radio',
        list: [
          {
            title: 'Navigate to product',
            value: 'link',
          },
          {
            title: 'Add to cart',
            value: 'addToCart',
          },
          {
            title: 'Buy now',
            value: 'buyNow',
          },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'quantity',
      type: 'number',
      initialValue: 1,
      hidden: ({parent}) => parent.linkAction === 'link',
      validation: (Rule) => Rule.required().min(1).max(10),
    }),
  ],
})
