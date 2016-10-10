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
  const FormBuilder = createFormBuilder({
    schema: mySchema,
    resolveInputComponent(field, type) {
      if (field.type === 'image') {
        return MyImageInput
      }
  },
  //...
})
`

export default function Placeholder() {
  return (
    <div>
      You have a field of type image, but not configured how to upload images.
      Please create a image input component and make sure it is resolved as the input for image types.
      <pre>
        <code>
          {CODE_SNIPPET}
        </code>
      </pre>
    </div>
  )
}
