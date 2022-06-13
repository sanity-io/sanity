import {
  CreditCardIcon,
} from "@sanity/icons";

export default {
  name: "product",
  type: "document",
  title: "Product",
  icon: CreditCardIcon,
  preview: {
    select: {
      title: "name",
      media: "variants.0.picture",
      variants: 'variants'
    },
    prepare({title, media, variants = []}) {
      const priceRangeMin = Math.min(Object.values(variants).map(variant => variant.price))
      const priceRangeMax = Math.max(Object.values(variants).map(variant => variant.price))
      const singlePrice = variants?.[0]?.price
      const priceRange = priceRangeMax > priceRangeMin ? `$${priceRangeMin} - $${priceRangeMax}` : singlePrice ? `$${priceRangeMax}` : 'No price set'

      return {
        title,
        media,
        subtitle: priceRange
      }
    }
  },
  fields: [
    {
      name: "name",
      type: "string",
      title: "Name",
    },
    {
      name: "description",
      title: "Description",
      type: "array",
      of: [{ type: "block" }],
    },
    {
      name: "variants",
      title: "Variants",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            {
              name: "name",
              type: "string",
              title: "Name",
            },
            {
              name: "price",
              type: "number",
              title: "Price (USD)",
            },
            {
              name: "picture",
              type: "image",
              title: "Picture",
              options: {
                hotspot: true, // <-- Defaults to false
              },
              fields: [
                {
                  name: "caption",
                  type: "string",
                  title: "Caption",
                  options: {
                    isHighlighted: true, // <-- make this field easily accessible
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
