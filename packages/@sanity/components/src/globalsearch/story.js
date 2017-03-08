/* eslint-disable react/no-multi-comp */
import React from 'react'
import {storiesOf, action} from 'part:@sanity/storybook'
import {withKnobs, text, boolean, object} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'

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
.addDecorator(withKnobs)
.addDecorator(centered)
.add(
  'Default',
  // `
  //   Global search. Can be invoked with cmd+shift+f, cmd+shift+s, ctrl+shift+f, ctrl+shift+s.
  //   Needs to be in an relative container.
  // `,
  () => {
    return (
      <Sanity part="part:@sanity/components/globalsearch/default" propTables={[GlobalSearch]}>
        <div style={elementStyle}>
          <GlobalSearch
            label={text('label', 'Search')}
            placeholder={text('placeholder', 'This is the placeholder')}
            isSearching={boolean('Is searching', false)}
            isOpen={boolean('is open', true)}
            items={object('items', items)}
            topItems={object('top tiems', [])}
            renderItem={renderItem}
            onChange={action('onChange')}
            onFocus={action('onFocus')}
            onBlur={action('onBlur')}
            onSearch={action('onSearch')}
            onClose={action('onClose')}
          />
        </div>
      </Sanity>
    )
  }
)

.add(
  'Basic',
  () => {
    return (
      <Sanity part="part:@sanity/components/globalsearch/default" propTables={[GlobalSearch]}>
        <div style={{backgroundColor: '#fff', width: '15em'}}>
          <GlobalSearch
            label={text('label', 'Search')}
            placeholder={text('placeholder', 'This is the placeholder')}
            isSearching={boolean('Is searching', false)}
            isOpen={boolean('is open', true)}
            items={items}
            onChange={action('onChange')}
            onFocus={action('onFocus')}
            onBlur={action('onBlur')}
            onSearch={action('onSearch')}
            onClose={action('onClose')}
            topItems={topItems}
            renderItem={renderItem}
          />
        </div>
      </Sanity>
    )
  }
)
