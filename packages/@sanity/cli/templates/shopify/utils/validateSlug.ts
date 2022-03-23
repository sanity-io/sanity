const slug = require('slug')

const MAX_LENGTH = 96

export const validateSlug = (Rule) => {
  return Rule.required().custom(async (value) => {
    const currentSlug = value && value.current
    if (!currentSlug) {
      return true
    }

    if (currentSlug.length >= MAX_LENGTH) {
      return `Must be less than ${MAX_LENGTH} characters`
    }

    if (currentSlug !== slug(currentSlug, {lower: true})) {
      return 'Must be a valid slug'
    }
    return true
  })
}
