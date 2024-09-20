import {defineConfig, defineField, defineType} from 'sanity'

export default defineConfig({
  projectId: import.meta.env.VITE_PERF_EFPS_PROJECT_ID,
  dataset: import.meta.env.VITE_PERF_EFPS_DATASET,
  schema: {
    types: [
      defineType({
        name: 'recipe',
        type: 'document',
        title: 'Recipe',
        fields: [
          defineField({name: 'name', type: 'string'}),
          defineField({name: 'slug', type: 'slug', options: {source: 'name'}}),
          defineField({name: 'description', type: 'text'}),
          defineField({name: 'image', type: 'image'}),
          defineField({name: 'prepTime', type: 'number', title: 'Preparation Time (minutes)'}),
          defineField({name: 'cookTime', type: 'number', title: 'Cooking Time (minutes)'}),
          defineField({name: 'servings', type: 'number', title: 'Number of Servings'}),
          defineField({name: 'ingredients', type: 'array', of: [{type: 'ingredient'}]}),
          defineField({name: 'instructions', type: 'array', of: [{type: 'block'}]}),
          defineField({name: 'category', type: 'reference', to: [{type: 'category'}]}),
          defineField({
            name: 'difficulty',
            type: 'string',
            title: 'Difficulty',
            options: {
              list: [
                {title: 'Easy', value: 'easy'},
                {title: 'Medium', value: 'medium'},
                {title: 'Hard', value: 'hard'},
              ],
            },
          }),
        ],
      }),
      defineType({
        name: 'ingredient',
        type: 'object',
        fields: [
          defineField({name: 'item', type: 'string'}),
          defineField({name: 'amount', type: 'number'}),
          defineField({name: 'unit', type: 'string'}),
        ],
      }),
      defineType({
        name: 'category',
        type: 'document',
        title: 'Category',
        fields: [
          defineField({name: 'name', type: 'string'}),
          defineField({name: 'description', type: 'text'}),
        ],
      }),
    ],
  },
})
