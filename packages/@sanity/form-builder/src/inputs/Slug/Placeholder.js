import React from 'react'
// Todo: make this nicer
const CODE_SNIPPET = `
  // ...
  import {SlugInput} from '@sanity/form-builder'
  const MySlugInput = createSlugInput({
    validate(slug) {
      // If not valid, resolve with a message why.
      if (slug === 'foobar') {
        return Promise.resolve('foobar is already taken')
      }
      // If it is valid, resolve with nothing
      return Promise.resolve()
    }
  })
  const FormBuilder = createFormBuilder({
    schema: mySchema,
    resolveInputComponent(type, type) {
      if (type.type === 'slug') {
        return MySlugInput
      }
  },
  //...
})
`

export default function Placeholder() {
  return (
    <div>
      <p>
        You have a type of type slug, but not configured a function
        to validate that the slug is not already in use.
        Please create a slug input component and make sure it is resolved as the input for slug types.
      </p>
      <pre>
        <code>
          {CODE_SNIPPET}
        </code>
      </pre>
    </div>
  )
}
