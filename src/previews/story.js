/* eslint-disable react/no-multi-comp */
import React from 'react'
import {storiesOf} from 'part:@sanity/storybook'
import DefaultPreview from 'part:@sanity/components/previews/default'
import DetailPreview from 'part:@sanity/components/previews/detail'
import InlinePreview from 'part:@sanity/components/previews/inline'
import MediaPreview from 'part:@sanity/components/previews/media'
import CardPreview from 'part:@sanity/components/previews/card'

const item = {
  title: 'This is the title',
  subtitle: 'This is the subtitle',
  description: 'This is the long the descriptions that should no be to long, beacuse we will cap it',
  mediaRender() {
    return (
      <div>
        <img src="http://www.fillmurray.com/500/300" />
      </div>
    )
  },
  date: new Date()
}

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
  backgroundColor: '#ccc',
  padding: '1em'
}

const centered = function (storyFn) {
  return <div style={style}>{storyFn()}</div>
}

storiesOf('Previews')
.addDecorator(centered)
.addWithInfo(
  'Default',
  `
    Default preview
  `,
  () => {
    return (
      <DefaultPreview item={item} />
    )
  },
  {
    propTables: [DefaultPreview],
    role: 'part:@sanity/components/previews/default'
  }
)
.addWithInfo(
  'Card',
  `
    Card
  `,
  () => {
    return (
      <CardPreview item={item} />
    )
  },
  {
    propTables: [CardPreview],
    role: 'part:@sanity/components/previews/card'
  }
)

.addWithInfo(
  'Detail',
  `
    Detail
  `,
  () => {
    return (
      <DetailPreview item={item} />
    )
  },
  {
    propTables: [DetailPreview],
    role: 'part:@sanity/components/previews/detail'
  }
)

.addWithInfo(
  'Media',
  `
    Detail
  `,
  () => {
    return (
      <MediaPreview item={item} />
    )
  },
  {
    propTables: [MediaPreview],
    role: 'part:@sanity/components/previews/media'
  }
)

.addWithInfo(
  'Inline',
  `
    Detail
  `,
  () => {
    return (
      <p>
        This is a text, and suddenly a inline preview appearst before <InlinePreview item={item} /> this word.
      </p>
    )
  },
  {
    propTables: [InlinePreview],
    role: 'part:@sanity/components/previews/inline'
  }
)
