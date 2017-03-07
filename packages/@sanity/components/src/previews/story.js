/* eslint-disable react/no-multi-comp */
import React from 'react'
import {storiesOf} from 'part:@sanity/storybook'
import DefaultPreview from 'part:@sanity/components/previews/default'
import DetailPreview from 'part:@sanity/components/previews/detail'
import InlinePreview from 'part:@sanity/components/previews/inline'
import MediaPreview from 'part:@sanity/components/previews/media'
import CardPreview from 'part:@sanity/components/previews/card'
import {withKnobs, object, boolean, number} from 'part:@sanity/storybook/addons/knobs'

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
      title: boolean('title', true) ? 'This is the title' : false,
      subtitle: boolean('subtitle', true) ? 'This is the subtitle' : false,
      description: boolean('description', true) ? 'This is the long the descriptions that should no be to long, beacuse we will cap it' : false,
      imageUrl: boolean('imageUrl', true) ? 'http://www.fillmurray.com/500/300' : false,
      date: boolean('date', true) ? new Date() : false
    }
    return (
      <DefaultPreview item={object('item', item)} isPlaceholder={boolean('placeholder', false)} />
    )
  },
  {
    propTables: [DefaultPreview],
    role: 'part:@sanity/components/previews/default'
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
      <CardPreview
        item={object('item', item)}
        isPlaceholder={boolean('placeholder', false)}
        aspect={number('aspect', 1, {range: true, min: 0.8, max: 3, step: 0.2})}
      />
    )
  },
  {
    propTables: [CardPreview],
    role: 'part:@sanity/components/previews/card'
  }
)

.add(
  'Detail',
  () => {
    const item = {
      title: boolean('title', true) ? 'This is the title' : false,
      subtitle: boolean('subtitle', true) ? 'This is the subtitle' : false,
      description: boolean('description', true) ? 'This is the long the descriptions that should no be to long, beacuse we will cap it' : false,
      imageUrl: boolean('imageUrl', true) ? 'http://www.fillmurray.com/500/300' : false,
      date: boolean('date', true) ? new Date() : false
    }
    return (
      <DetailPreview item={object('item', item)} isPlaceholder={boolean('placeholder', false)} />
    )
  },
  {
    propTables: [DetailPreview],
    role: 'part:@sanity/components/previews/detail'
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
      <MediaPreview item={object('item', item)} isPlaceholder={boolean('placeholder', false)} />
    )
  },
  {
    propTables: [MediaPreview],
    role: 'part:@sanity/components/previews/media'
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
      <p>
        This is a text, and suddenly a inline preview appearst before
        <InlinePreview item={object('item', item)} isPlaceholder={boolean('placeholder', false)} />
        this word.
      </p>
    )
  },
  {
    propTables: [InlinePreview],
    role: 'part:@sanity/components/previews/inline'
  }
)
