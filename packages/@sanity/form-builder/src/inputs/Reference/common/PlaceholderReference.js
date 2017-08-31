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
  function resolveInputComponent(type, type) {
    if (type.type === 'reference') {
      return MyReferenceInput
    }
  }
  //...
  <FormBuilder
    schema={mySchema}
    resolveInputComponent={resolveInputComponent}
    //...
  />
})
`

export default function PlaceholderReferenceInput() {
  return (
    <div>
      You have a type of type reference, but not configured how to look up references.
      Please create a Reference input and make sure it is resolved as the input for reference types.
      <pre>
        <code>
          {CODE_SNIPPET}
        </code>
      </pre>
    </div>
  )
}
