import React from 'react'
import {storiesOf, action} from 'component:@sanity/storybook'

import DefaultTextField from 'component:@sanity/components/textfields/default'
import DefaultList from 'component:@sanity/components/lists/default'
import DefaultListItem from 'component:@sanity/components/lists/items/default'
import ThumbsList from 'component:@sanity/components/lists/thumbs'
import Thumb from 'component:@sanity/components/lists/items/thumb'

import {range} from 'lodash'
import faker from 'faker'

const containerStyle = {
  maxWidth: '40em',
  maxHeight: '20em',
  overflowX: 'hidden',
  overflowY: 'auto',
  boxShadow: '0 0 10px #ccc',
  position: 'relative'
}

const defaultItems = range(100).map((item, i) => {
  return {
    key: `${i}`,
    title: faker.name.findName()
  }
})


storiesOf('Lists')
.addWithInfo(
  'Default',
  `
    The default fieldset is used to gather a collection of fields.
  `,
  () => {
    return (
      <div style={containerStyle}>
        <DefaultList items={defaultItems} onSelect={action('Select')} />
      </div>
    )
  },
  {
    propTables: [DefaultList],
    role: 'component:@sanity/components/lists/default'
  }
)

.addWithInfo(
  'Default witih selected item',
  `
    The default fieldset is used to gather a collection of fields.
  `,
  () => {
    return (
      <div style={containerStyle}>
        <DefaultList items={defaultItems} selectedItem={items[3]} onSelect={action('Select')} />
      </div>
    )
  },
  {
    propTables: [DefaultList],
    role: 'component:@sanity/components/lists/default'
  }
)

.addWithInfo(
  'With filter',
  `
    The default fieldset is used to gather a collection of fields.
  `,
  () => {
    let filterValue = ''
    const setFilterValue = function (value) {
      filterValue = value
    }
    return (
      <div style={containerStyle}>
        <DefaultTextField onChange={setFilterValue} label="Type to filter…" />
        <DefaultList items={defaultItems} selectedItem={defaultItems[2]} onSelect={action('Select')} filter={filterValue} filterKeys={'test'} />
      </div>
    )
  },
  {
    propTables: [DefaultList],
    role: 'component:@sanity/components/lists/default'
  }
)


.addWithInfo(
  'Thumbs',
  `
    Showing landscape thumbs in a grid
  `,
  () => {
    const items = range(100).map((item, i) => {
      return {
        key: `${i}`,
        title: faker.name.findName(),
        image: `${faker.image.imageUrl()}?${i}`
      }
    })
    return (
      <div style={containerStyle}>
        <ThumbsList items={items} scrollable onSelect={action('Select')} />
      </div>
    )
  },
  {
    propTables: [ThumbsList],
    role: 'component:@sanity/components/lists/thumbs'
  }
)

.addWithInfo(
  'Thumbs (portrait)',
  `
    Showing portrait thumbs in a grid
  `,
  () => {
    const items = range(100).map((item, i) => {
      return {
        key: `${i}`,
        title: faker.name.findName(),
        image: `${faker.image.imageUrl(300, 500)}?${i}`
      }
    })
    return (
      <div style={containerStyle}>
        <ThumbsList items={items} scrollable onSelect={action('Select')} />
      </div>
    )
  },
  {
    propTables: [ThumbsList],
    role: 'component:@sanity/components/lists/thumbs'
  }
)

.addWithInfo(
  'Thumbs (mixed)',
  `
    Showing portrait thumbs in a grid
  `,
  () => {
    const items = range(100).map((item, i) => {
      const width = Math.round(Math.random() * 100)
      const height = Math.round(Math.random() * 100)
      return {
        key: `${i}`,
        title: faker.name.findName(),
        image: `${faker.image.imageUrl(width, height)}?${i}`,
      }
    })
    return (
      <div style={containerStyle}>
        <ThumbsList items={items} scrollable />
      </div>
    )
  },
  {
    propTables: [ThumbsList],
    role: 'component:@sanity/components/lists/thumbs'
  }
)

.addWithInfo(
  'Thumbs (with info)',
  `
    Showing portrait thumbs in a grid
  `,
  () => {
    const items = range(100).map((item, i) => {
      return {
        key: `${i}`,
        title: faker.name.findName(),
        image: `${faker.image.imageUrl()}?${i}`
      }
    })
    return (
      <div style={containerStyle}>
        <ThumbsList items={items} scrollable showInfo onSelect={action('Select')} />
      </div>
    )
  },
  {
    propTables: [ThumbsList],
    role: 'component:@sanity/components/lists/thumbs'
  }
)


storiesOf('Lists items')
  .addWithInfo(
  'Default',
  `
    The default fieldset is used to gather a collection of fields.
  `,
  () => {
    return (
      <DefaultListItem title={faker.name.findName()} index={2} onClick={action('Click')} />
    )
  },
  {
    propTables: [DefaultListItem],
    role: 'component:@sanity/components/lists/items/default'
  }
)
.addWithInfo(
  'Thumb',
  `
    The default fieldset is used to gather a collection of fields.
  `,
  () => {
    return (
      <Thumb title={faker.name.findName()} index="1" image={`${faker.image.avatar()}?1`} onClick={action('Click')} />
    )
  },
  {
    propTables: [Thumb],
    role: 'component:@sanity/components/lists/items/thumb'
  }
)
.addWithInfo(
  'Thumb with info',
  `
    The default fieldset is used to gather a collection of fields.
  `,
  () => {
    return (
      <div style={{width: '300px'}}>
        <Thumb
          showInfo
          title={faker.name.findName()}
          index="1"
          image={`${faker.image.avatar()}?1`}
          onClick={action('Click')}
        />
      </div>
    )
  },
  {
    propTables: [Thumb],
    role: 'component:@sanity/components/lists/items/thumb'
  }
)
