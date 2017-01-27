import React from 'react'

const CODE_SNIPPET = `
  // ...
  import {SlugInput} from '@sanity/form-builder'
  const MySlugInput = createSlugInput({
    validate(type, slug, myDocId) {
      // If not valid, resolve with a message why.
      if (slug === 'foobar' && myDocId !== 'foo/bar') {
        return Promise.resolve('foobar is already used as a slug in another document')
      }
      // If it is valid, resolve with nothing
      return Promise.resolve()
    }
  })
  const FormBuilder = createFormBuilder({
    schema: mySchema,
    resolveInputComponent(type) {
      if (type.name === 'slug') {
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
