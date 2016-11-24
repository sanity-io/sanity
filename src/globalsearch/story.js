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
  backgroundImage: 'linear-gradient(45deg, black 25%, transparent 25%, transparent 75%, black 75%, black), linear-gradient(45deg, black 25%, transparent 25%, transparent 75%, black 75%, black)',
  backgroundSize: '60px 60px',
  backgroundPosition: '0 0, 30px 30px'
}

const innerStyle = {

}

const elementStyle = {
  position: 'relative',
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
    Global search. Can be invoked with cmd+shift+f, cmd+shift+s, ctrl+shift+f, ctrl+shift+s.
    Needs to be in an relative container.
  `,
  () => {
    return (
      <div style={elementStyle}>
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
      </div>
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
      <div style={elementStyle}>
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
      </div>
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
      <div style={elementStyle}>
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
      </div>
    )
  },
  {
    propTables: [GlobalSearch],
    role: 'part:@sanity/components/globalsearch/default'
  }
)
