import React from 'react'
import {storiesOf, action} from 'part:@sanity/storybook'
import ImageInput from 'part:@sanity/components/imageinput/fieldset'
import ImageSelect from 'part:@sanity/components/imageinput/image-select'
import buttonStyles from 'part:@sanity/components/buttons/default-style'
import Button from 'part:@sanity/components/buttons/default'
import UploadIcon from 'part:@sanity/base/upload-icon'
import Dialog from 'part:@sanity/components/dialogs/default'
import {withKnobs, number, text, boolean, select, object} from 'part:@sanity/storybook/addons/knobs'

const imageUrl = `https://unsplash.it/${parseInt(Math.random() * 10, 0) * 100}/${parseInt(Math.random() * 10, 0) * 100}`

const renderEdit = () => {
  return (
    <Dialog title="Edit image" isOpen onClose={action('close')}>
      Edit stuff here
    </Dialog>
  )
}

storiesOf('Image input')
.add(
  'Image select',
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
.add(
  'Image select as button',
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

.add(
  'Image select inside button',
  // `
  //   Remember to set ripple to false
  // `,
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
.addDecorator(withKnobs)
.add(
  'Fieldset',
  () => {
    return (
      <ImageInput
        legend={text('Legend', 'This is the legend')}
        onSelect={action('Select image')}
        onEdit={action('onEdit')}
        onClear={action('onClear')}
        onCancel={action('onCancel')}
        status={select('Status', ['ready', 'error', 'pending'], 'ready')}
        percent={number('percent', 50, {range: true, min: 0, max: 100, step: 5})}
        level={number('Level', 0)}
        multiple={boolean('Multiple', false)}
        hotspotImage={object('hotspotImage', {imageUrl: imageUrl})}
        showContent={boolean('show content', false)}
        accept={text('accept', 'image/png')}
      >
        {text('Content', 'This is the content')}
      </ImageInput>
    )
  },
  {
    propTables: [ImageInput],
    role: 'part:@sanity/components/imageinput/fieldset'
  }
)

.add(
  'Invalid url',
  () => {
    return (
      <ImageInput
        legend="Image input fieldset"
        onSelect={action('Select image')}
        status="complete"
        hotspotImage={{imageUrl: 'http://This.is.not.a.valid.url'}}
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
.add(
  'Invalid blob',
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
