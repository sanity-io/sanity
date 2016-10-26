import React from 'react'
import {storiesOf, action} from 'part:@sanity/storybook'
import ImageInput from 'part:@sanity/components/imageinput/fieldset'

const imageUrl = `https://unsplash.it/${parseInt(Math.random() * 10, 0) * 100}/${parseInt(Math.random() * 10, 0) * 100}`

storiesOf('Image input')
.addWithInfo(
  'Fieldset',
  `
    Image input for uploading images.
  `,
  () => {
    return (
      <ImageInput
        legend="Image input fieldset"
        onSelect={action('Select image')}
      >
        <h2>Content goes here</h2>
      </ImageInput>
    )
  },
  {
    propTables: [ImageInput],
    role: 'part:@sanity/components/imageinput/fieldset'
  }
)

.addWithInfo(
  'Fieldset (error)',
  `
    Image input for uploading images.
  `,
  () => {
    return (
      <ImageInput
        legend="Image input fieldset"
        onSelect={action('Select image')}
        status="error"
        percent="43"
        hotspotImage={{
          imageUrl: 'http://lorempixel.com/700/700'
        }}
      >
        <h2>Content goes here</h2>
      </ImageInput>
    )
  },
  {
    propTables: [ImageInput],
    role: 'part:@sanity/components/imageinput/fieldset'
  }
)


.addWithInfo(
  'Fieldset (43%)',
  `
    Image input for uploading images.
  `,
  () => {
    return (
      <ImageInput
        legend="Image input fieldset"
        onSelect={action('Select image')}
        onCancel={action('Cancel upload')}
        status="pending"
        percent="43"
        uploadingImage
        hotspotImage={{
          imageUrl: 'http://lorempixel.com/700/700'
        }}
      >
        <h2>Content goes here</h2>
      </ImageInput>
    )
  },
  {
    propTables: [ImageInput],
    role: 'part:@sanity/components/imageinput/fieldset'
  }
)

.addWithInfo(
  'Fieldset (completed)',
  `
    Image input for uploading images.
  `,
  () => {
    return (
      <ImageInput
        legend="Image input fieldset"
        onSelect={action('Select image')}
        status="complete"
        percent="100"
        hotspotImage={{
          imageUrl: imageUrl
        }}
      >
        <h2>Content goes here</h2>
      </ImageInput>
    )
  },
  {
    propTables: [ImageInput],
    role: 'part:@sanity/components/imageinput/fieldset'
  }
)
