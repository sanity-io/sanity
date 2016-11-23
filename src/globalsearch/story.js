/* eslint-disable react/no-multi-comp */
import React from 'react'
import {storiesOf, action} from 'part:@sanity/storybook'
import {range} from 'lodash'
import GlobalSearch from 'part:@sanity/components/globalsearch/default'

import Chance from 'chance'
const chance = new Chance()

import DefaultPreview from 'part:@sanity/components/previews/default'
import DetailPreview from 'part:@sanity/components/previews/detail'

const items = range(7).map((item, i) => {
  return {
    title: chance.name(),
    subtitle: chance.sentence(),
    imageUrl: chance.avatar(),
    key: `${i}`
  }
})

const topItems = range(3).map((item, i) => {
  return {
    title: chance.name(),
    subtitle: chance.sentence(),
    imageUrl: chance.avatar(),
    key: `${i}`
  }
})

const style = {
  height: '100vh',
  position: 'absolute',
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
  padding: '1em',
  backgroundColor: '#269',
  // eslint-disable-next-line max-len
  backgroundImage: 'linear-gradient(white 2px, transparent 2px), linear-radient(90deg, white 2px, transparent 2px), linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)',
  backgroundSize: '100px 100px, 100px 100px, 20px 20px, 20px 20px',
  backgroundPosition: '-2px -2px, -2px -2px, -1px -1px, -1px -1px'
}

const innerStyle = {
  position: 'absolute',
  left: '1em',
  top: '1em',
  width: '30em',
  fontSize: '1rem',
  padding: '0.5rem',
  backgroundColor: '#fff'
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

const renderItem = (item, options) => {
  if (options && options.isTopHit) {
    return (
      <DetailPreview item={item} />
    )
  }
  return (
    <DefaultPreview item={item} />
  )
}


storiesOf('Global Search')
.addDecorator(centered)
.addWithInfo(
  'Closed',
  `
    Global search. Can be invoked with cmd+shift+f, cmd+shift+s, ctrl+shift+f, ctrl+shift+s
  `,
  () => {
    return (
      <GlobalSearch
        label="Label"
        placeholder="This is the placeholder"
        onChange={action('onChange')}
        onFocus={action('onFocus')}
        onBlur={action('onBlur')}
        onSearch={action('onSearch')}
        onClose={action('onClose')}
        items={items}
      />
    )
  },
  {
    propTables: [GlobalSearch],
    role: 'part:@sanity/components/globalsearch/default'
  }
)


.addWithInfo(
  'Searching',
  `
    Global search. Can be invoked with cmd+T
  `,
  () => {
    return (
      <GlobalSearch
        label="Label"
        placeholder="This is the placeholder"
        onChange={action('onChange')}
        onFocus={action('onFocus')}
        onBlur={action('onBlur')}
        onSearch={action('onSearch')}
        onClose={action('onClose')}
        isSearching
        isOpen
      />
    )
  },
  {
    propTables: [GlobalSearch],
    role: 'part:@sanity/components/globalsearch/default'
  }
)


.addWithInfo(
  'Open',
  `
    Global search. Can be invoked with cmd+T
  `,
  () => {
    return (
      <GlobalSearch
        label="Label"
        placeholder="This is the placeholder"
        onChange={action('onChange')}
        onFocus={action('onFocus')}
        onBlur={action('onBlur')}
        onSearch={action('onSearch')}
        onClose={action('onClose')}
        topItems={topItems}
        items={items}
        renderItem={renderItem}
        isOpen
      />
    )
  },
  {
    propTables: [GlobalSearch],
    role: 'part:@sanity/components/globalsearch/default'
  }
)
