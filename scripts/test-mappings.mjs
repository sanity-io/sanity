export const pathToTagMapping = [
  {
    paths: ['packages/sanity/src/core/comments/**'],
    tags: ['@comments'],
  },
  {
    paths: ['packages/sanity/src/core/field/**'],
    tags: ['@fields'],
  },
  // Add more mappings as needed
]

// Default tags to run if no specific mappings match
export const defaultTags = ['@smoke', '@core']
