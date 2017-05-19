import React from 'react'
const CODE_SNIPPET = `
import {ReferenceInput} from '@sanity/form-builder'

function search(query) {
  //... code that finds documents matching the given query
  // must return either an array with documents,
  // a promise or an observable (recommended) that resolves to an array of documents
}

function valueToString(referenceId) {
  //... code that fetches the document by the given id and returns a string representation of it.
  // must return either the string, a promise or an observable (recommended) that resolves
  // to the string representation
}

// Create your own ReferenceInput that wraps the builtin one and supplies the "searchFn"
// and "valueToStringFn" props
function MyReferenceInput(props) {
  return (
    <ReferenceInput
      searchFn={search}
      valueToStringFn={valueToString}
      {...props}
    />
  )
}

// Configure the FormBuilder to use your Reference component for reference types
const FormBuilder = createFormBuilder({
  resolveInputComponent(type, type) {
    if (type.type === 'reference') {
      return MyReferenceInput
    }
  },
  //...
})`

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
