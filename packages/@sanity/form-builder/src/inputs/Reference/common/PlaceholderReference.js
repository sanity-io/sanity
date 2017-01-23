import React from 'react'
// Todo: make this nicer
const CODE_SNIPPET = `
  // ...
  import {createReferenceInput} from '@sanity/form-builder'
  const MyReferenceInput = createReferenceInput({
    search(query) {
      //... code that searches for references
    }
    materializeReferences(referenceIds) {
      //... code that finds documents matching referenceIds
    }
  })
  const FormBuilder = createFormBuilder({
    schema: mySchema,
    resolveInputComponent(field, type) {
      if (field.type === 'reference') {
        return MyReferenceInput
      }
  },
  //...
})
`

export default function PlaceholderReferenceInput() {
  return (
    <div>
      You have a field of type reference, but not configured how to look up references.
      Please create a Reference input and make sure it is resolved as the input for reference types.
      <pre>
        <code>
          {CODE_SNIPPET}
        </code>
      </pre>
    </div>
  )
}
