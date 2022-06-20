import sanityClient from 'part:@sanity/base/client'
import imageUrlBuilder from '@sanity/image-url'

const builder = imageUrlBuilder(sanityClient)

export function urlFor(sanityImageField) {
  return sanityImageField.asset ? builder.image(sanityImageField) : undefined
}
