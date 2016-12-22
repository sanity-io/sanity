import React from 'react'
import {storiesOf, action} from 'part:@sanity/storybook'
import ImageInput from 'part:@sanity/components/imageinput/fieldset'
import ImageSelect from 'part:@sanity/components/imageinput/image-select'
import buttonStyles from 'part:@sanity/components/buttons/default-style'
import Button from 'part:@sanity/components/buttons/default'
import UploadIcon from 'part:@sanity/base/upload-icon'

const imageUrl = `http://placekitten.com/g/${parseInt(Math.random() * 10, 0) * 100}/${parseInt(Math.random() * 10, 0) * 100}`

storiesOf('Image input')
.addWithInfo(
  'Image select',
  `
    Image input for uploading images.
  `,
  () => {
    return (
      <ImageSelect
        onSelect={action('onSelect')}
      >
        Upload image…
      </ImageSelect>
    )
  },
  {
    propTables: [ImageSelect],
    role: 'part:@sanity/components/imageinput/image-select'
  }
)
.addWithInfo(
  'Image select as button',
  `
    Image input for uploading images.
  `,
  () => {
    return (
      <div className={buttonStyles.default}>
        <ImageSelect
          onSelect={action('onSelect')}
          className={buttonStyles.content}
        >
          Upload image…
        </ImageSelect>
      </div>
    )
  },
  {
    propTables: [ImageSelect],
    role: 'part:@sanity/components/imageinput/image-select'
  }
)

.addWithInfo(
  'Image select inside button',
  `
    Remember to set ripple to false
  `,
  () => {
    return (
      <Button
        icon={UploadIcon}
        ripple={false}
      >
        <ImageSelect
          onSelect={action('onSelect')}
        >
          Upload image…
        </ImageSelect>
      </Button>
    )
  },
  {
    propTables: [ImageSelect],
    role: 'part:@sanity/components/imageinput/image-select'
  }
)

storiesOf('Image input Fieldset')

.addWithInfo(
  'Level 0',
  `
    Image input for uploading images.
  `,
  () => {
    return (
      <ImageInput
        legend="Image input fieldset"
        onSelect={action('Select image')}
        status="ready"
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
  'Level 1',
  `
    Image input for uploading images.
  `,
  () => {
    return (
      <ImageInput
        legend="Image input fieldset"
        onSelect={action('Select image')}
        status="ready"
        level={1}
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
  'Only image',
  `
    Image input for uploading images.
  `,
  () => {
    return (
      <ImageInput
        legend="Image input fieldset"
        onSelect={action('Select image')}
        hotspotImage={{imageUrl: imageUrl}}
      />
    )
  },
  {
    propTables: [ImageInput],
    role: 'part:@sanity/components/imageinput/fieldset'
  }
)

.addWithInfo(
  'Error on upload',
  `
    Image input for uploading images.
  `,
  () => {
    return (
      <ImageInput
        legend="Image input fieldset"
        onSelect={action('Select image')}
        status="error"
        percent={43}
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


.addWithInfo(
  'Progress 43%',
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
        percent={43}
        uploadingImage
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
        percent={100}
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

.addWithInfo(
  'Provided only imageUrl (status ready)',
  `
    Image input for uploading images.
  `,
  () => {
    return (
      <ImageInput
        legend="Image input fieldset"
        onSelect={action('Select image')}
        status="ready"
        imageUrl={imageUrl}
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
  'Invalid url',
  `
    Image input for uploading images.
  `,
  () => {
    return (
      <ImageInput
        legend="Image input fieldset"
        onSelect={action('Select image')}
        status="complete"
        hotspotImage={{imageUrl: 'This is no a valid url'}}
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
  'Invalid blob',
  `
    Image input for uploading images.
  `,
  () => {
    return (
      <ImageInput
        legend="Image input fieldset"
        onSelect={action('Select image')}
        status="complete"
        hotspotImage={{imageUrl: 'blob:http://this.is.no.valid'}}
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
