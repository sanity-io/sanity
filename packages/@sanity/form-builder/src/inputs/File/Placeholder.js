import React from 'react'
// Todo: make this nicer
const CODE_SNIPPET = `
  // ...
  import {FileInput} from '@sanity/form-builder'
  const MyFileInput = createFileInput({
    upload(files) {
      //... code that uploads all files in array
    }
  })
  function resolveInputComponent(type, type) {
    if (type.type === 'file') {
      return MyFileInput
    }
  }
  <FormBuilder
    schema={mySchema}
    resolveInputComponent={resolveInputComponent}
    //...
  />
`

export default function Placeholder() {
  return (
    <div>
      You have a type of type file, but not configured how to upload files.
      Please create a file input component and make sure it is resolved as the input for file types.
      <pre>
        <code>
          {CODE_SNIPPET}
        </code>
      </pre>
    </div>
  )
}
