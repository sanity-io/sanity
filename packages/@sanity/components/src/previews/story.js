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
  imageUrl: 'http://www.fillmurray.com/500/300',
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
  'Default (placeholder)',
  `
    Default preview
  `,
  () => {
    return (
      <DefaultPreview item={item} isPlaceholder />
    )
  },
  {
    propTables: [DefaultPreview],
    role: 'part:@sanity/components/previews/default'
  }
)


.addWithInfo(
  'Default (no media)',
  `
    Default preview with title and subtitle
  `,
  () => {
    return (
      <DefaultPreview item={{title: 'This is the title', subtitle: 'This is the subtitle'}} />
    )
  },
  {
    propTables: [DefaultPreview],
    role: 'part:@sanity/components/previews/default'
  }
)

.addWithInfo(
  'Default (only title)',
  `
    Default preview with title and subtitle
  `,
  () => {
    return (
      <DefaultPreview item={{title: 'This is the title'}} />
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
  'Detail (placeholder)',
  `
    Detail
  `,
  () => {
    return (
      <DetailPreview item={item} isPlaceholder />
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
  'Media (placeholder)',
  `
    Detail
  `,
  () => {
    return (
      <MediaPreview item={item} isPlaceholder />
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
