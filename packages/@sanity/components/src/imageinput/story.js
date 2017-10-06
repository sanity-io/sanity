import React from 'react'
import {storiesOf, action} from 'part:@sanity/storybook'
import {withKnobs, number, text, boolean, select, object} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import ImageInput from 'part:@sanity/components/imageinput/default'
import ImageSelect from 'part:@sanity/components/imageinput/image-select'
import buttonStyles from 'part:@sanity/components/buttons/default-style'
import Button from 'part:@sanity/components/buttons/default'
import UploadIcon from 'part:@sanity/base/upload-icon'
import Dialog from 'part:@sanity/components/dialogs/default'

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
      <Sanity part="part:@sanity/components/imageinput/image-select" propTables={[ImageSelect]}>
        <ImageSelect
          onSelect={action('onSelect')}
        >
          Upload image…
        </ImageSelect>
      </Sanity>
    )
  }
)
.add(
  'Image select as button',
  () => {
    return (
      <Sanity part="part:@sanity/components/imageinput/image-select" propTables={[ImageSelect]}>
        <div className={buttonStyles.default}>
          <ImageSelect
            onSelect={action('onSelect')}
            className={buttonStyles.content}
          >
            Upload image…
          </ImageSelect>
        </div>
      </Sanity>
    )
  }
)

.add(
  'Image select inside button',
  // `
  //   Remember to set ripple to false
  // `,
  () => {
    return (
      <Sanity part="part:@sanity/components/imageinput/image-select" propTables={[ImageSelect]}>
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
      </Sanity>
    )
  }
)

storiesOf('Image input Fieldset')
.addDecorator(withKnobs)
.add(
  'Fieldset',
  () => {
    const invalidHotspotImage = {imageUrl: 'http://This.is.not.a.valid.url'}

    return (
      <Sanity part="part:@sanity/components/imageinput/fieldset" propTables={[ImageInput]}>
        <ImageInput
          legend={text('Legend (prop)', 'This is the legend')}
          onSelect={action('Select image')}
          onEdit={action('onEdit')}
          onClear={action('onClear')}
          onCancel={action('onCancel')}
          status={select('Status (prop)', ['ready', 'error', 'pending'], 'ready')}
          percent={number('percent (prop)', 50, {range: true, min: 0, max: 100, step: 5})}
          level={number('Level (prop)', 0)}
          multiple={boolean('Multiple (prop)', false)}
          hotspotImage={boolean('invalid image', false) ? invalidHotspotImage : object('hotspotImage (prop)', {imageUrl: imageUrl})}
          showContent={boolean('show content (prop)', false)}
          accept={text('accept (prop)', 'image/png')}
        >
          {text('children (prop)', 'This is the content')}
        </ImageInput>
      </Sanity>
    )
  }
)
