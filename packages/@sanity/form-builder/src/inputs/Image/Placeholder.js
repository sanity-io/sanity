import React from 'react'
// Todo: make this nicer
const CODE_SNIPPET = `
  // ...
  import {ImageInput} from '@sanity/form-builder'
  const MyImageInput = ImageInput.create({
    upload(images) {
      //... code that uploads all images in array
    }
  })


  function resolveInputComponent(type, type) {
    if (type.type === 'image') {
      return MyImageInput
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
      You have a type of type image, but not configured how to upload images.
      Please create a image input component and make sure it is resolved as the input for image types.
      <pre>
        <code>
          {CODE_SNIPPET}
        </code>
      </pre>
    </div>
  )
}
