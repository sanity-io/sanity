/* eslint-disable react/no-multi-comp */
import React from 'react'
import {storiesOf} from 'part:@sanity/storybook'
import DefaultPreview from 'part:@sanity/components/previews/default'
import DetailPreview from 'part:@sanity/components/previews/detail'
import InlinePreview from 'part:@sanity/components/previews/inline'
import MediaPreview from 'part:@sanity/components/previews/media'
import CardPreview from 'part:@sanity/components/previews/card'
import {withKnobs, object, boolean, number, text, range} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'

const style = {
  height: '100vh',
  position: 'absolute',
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#eee',
  padding: '1em'
}

const innerStyle = {
  border: '1px dotted #ccc',
  width: '500px'
}

const centered = function (storyFn) {
  return (
    <div style={style}>
      <div style={innerStyle}>
        {storyFn()}
      </div>
    </div>
  )
}

storiesOf('Previews')
  .addDecorator(centered)
  .addDecorator(withKnobs)
  .add(
    'Default',
    () => {
      const item = {
        title: text('title', 'This is the title'),
        subtitle: text('subtitle', 'This is the subtitle'),
        description: text('description', 'This is the long the descriptions that should no be to long, beacuse we will cap it'),
        imageUrl: 'http://www.fillmurray.com/500/300',
        date: new Date()
      }
      return (
        <Sanity part="part:@sanity/components/previews/default" propTables={[DefaultPreview]}>
          <DefaultPreview
            item={item}
            isPlaceholder={boolean('placeholder (prop)', false)}
            progress={number('progress (prop)', undefined, {
              range: true,
              min: 0,
              max: 100,
              step: 1
            })}
          />
        </Sanity>
      )
    }
  )

  .add(
    'Card',
    () => {
      const item = {
        title: boolean('title', true) ? 'This is the title' : false,
        subtitle: boolean('subtitle', true) ? 'This is the subtitle' : false,
        description: boolean('description', true) ? 'This is the long the descriptions that should no be to long, beacuse we will cap it' : false,
        imageUrl: boolean('imageUrl', true) ? 'http://www.fillmurray.com/500/300' : false,
        date: boolean('date', true) ? new Date() : false
      }
      return (
        <Sanity part="part:@sanity/components/previews/card" propTables={[CardPreview]}>
          <CardPreview
            item={object('item (prop)', item)}
            isPlaceholder={boolean('placeholder (prop)', false)}
            aspect={number('aspect (prop)', 1, {range: true, min: 0.8, max: 3, step: 0.2})}
          />
        </Sanity>
      )
    }
  )

  .add(
    'Detail',
    () => {
      const item = {
        title: text('title', 'This is the title'),
        subtitle: text('subtitle', 'This is the subtitle'),
        description: text('description', 'This is the long the descriptions that should no be to long, beacuse we will cap it'),
        imageUrl: 'http://www.fillmurray.com/500/300',
        date: new Date()
      }
      return (
        <Sanity part="part:@sanity/components/previews/detail" propTables={[DetailPreview]}>
          <DetailPreview
            item={object('item (prop)', item)}
            isPlaceholder={boolean('isplaceholder (prop)', false)}
          />
        </Sanity>
      )
    }
  )

  .add(
    'Media',
    () => {
      const item = {
        title: boolean('title', true) ? 'This is the title' : false,
        subtitle: boolean('subtitle', true) ? 'This is the subtitle' : false,
        description: boolean('description', true) ? 'This is the long the descriptions that should no be to long, beacuse we will cap it' : false,
        imageUrl: boolean('imageUrl', true) ? 'http://www.fillmurray.com/500/300' : false,
        date: boolean('date', true) ? new Date() : false
      }
      return (
        <Sanity part="part:@sanity/components/previews/media" propTables={[MediaPreview]}>
          <MediaPreview
            item={object('item (prop)', item)}
            isPlaceholder={boolean('isplaceholder (prop)', false)}
          />
        </Sanity>
      )
    }
  )

  .add(
    'Inline',
    () => {
      const item = {
        title: boolean('title', true) ? 'This is the title' : false,
        subtitle: boolean('subtitle', true) ? 'This is the subtitle' : false,
        description: boolean('description', true) ? 'This is the long the descriptions that should no be to long, beacuse we will cap it' : false,
        imageUrl: boolean('imageUrl', true) ? 'http://www.fillmurray.com/500/300' : false,
        date: boolean('date', true) ? new Date() : false
      }
      return (
        <Sanity part="part:@sanity/components/previews/inline" propTables={[InlinePreview]}>
          <p>
          This is a text, and suddenly a inline preview appearst before
            <InlinePreview
              item={object('item (prop)', item)}
              isPlaceholder={boolean('isPlaceholder (prop)', false)}
            />
          this word.
          </p>
        </Sanity>
      )
    }
  )
