import React from 'react'
import {storiesOf, action} from 'part:@sanity/storybook'

import DefaultList from 'part:@sanity/components/lists/default'
import DefaultListItem from 'part:@sanity/components/lists/items/default'
import GridList from 'part:@sanity/components/lists/grid'
import GridItem from 'part:@sanity/components/lists/items/grid'

import {range} from 'lodash'
import faker from 'faker'

const containerStyle = {
  maxWidth: '40em',
  height: '20em',
  boxShadow: '0 0 10px #ccc',
  position: 'relative',
  overflow: 'hidden'
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
        <DefaultList
          items={defaultItems}
          onSelect={action('Select')}
        />
      </div>
    )
  },
  {
    propTables: [DefaultList],
    role: 'part:@sanity/components/lists/default'
  }
)

.addWithInfo(
  'Default, scrollable with selected item',
  `
    The default fieldset is used to gather a collection of fields.
  `,
  () => {
    const selectedItem = defaultItems[3]
    return (
      <div style={containerStyle}>
        <DefaultList
          items={defaultItems}
          selectedItem={selectedItem}
          onSelect={action('Select')}
          scrollable
        />
      </div>
    )
  },
  {
    propTables: [DefaultList],
    role: 'part:@sanity/components/lists/default'
  }
)

.addWithInfo(
  'Default, scrollable with selected item and highlighted item',
  `
    The default fieldset is used to gather a collection of fields.
  `,
  () => {
    const selectedItem = defaultItems[3]
    const highlightedItem = defaultItems[5]
    return (
      <div style={containerStyle}>
        <DefaultList
          items={defaultItems}
          selectedItem={selectedItem}
          highlightedItem={highlightedItem}
          onSelect={action('Select')}
          scrollable
        />
      </div>
    )
  },
  {
    propTables: [DefaultList],
    role: 'part:@sanity/components/lists/default'
  }
)


.addWithInfo(
  'Default scrollable, with selected item outside view',
  `
    The default fieldset is used to gather a collection of fields.
  `,
  () => {
    const selectedItem = defaultItems[50]
    return (
      <div style={containerStyle}>
        <DefaultList
          items={defaultItems}
          selectedItem={selectedItem}
          onSelect={action('Select')}
          scrollable
        />
      </div>
    )
  },
  {
    propTables: [DefaultList],
    role: 'part:@sanity/components/lists/default'
  }
)


.addWithInfo(
  'GridList',
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
        <GridList items={items} scrollable onSelect={action('Select')} />
      </div>
    )
  },
  {
    propTables: [GridList],
    role: 'part:@sanity/components/lists/grid'
  }
)

.addWithInfo(
  'GridList with text',
  `
    Showing landscape thumbs in a grid
  `,
  () => {
    const items = range(100).map((item, i) => {
      return {
        key: `${i}`,
        title: faker.name.findName(),
        subTitle: faker.name.findName()
      }
    })
    return (
      <div style={containerStyle}>
        <GridList items={items} scrollable onSelect={action('Select')} />
      </div>
    )
  },
  {
    propTables: [GridList],
    role: 'part:@sanity/components/lists/grid'
  }
)


.addWithInfo(
  'GridList (portrait)',
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
        <GridList items={items} scrollable onSelect={action('Select')} />
      </div>
    )
  },
  {
    propTables: [GridList],
    role: 'part:@sanity/components/lists/grid'
  }
)

.addWithInfo(
  'GridList (mixed)',
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
        <GridList items={items} scrollable />
      </div>
    )
  },
  {
    propTables: [GridList],
    role: 'part:@sanity/components/lists/grid'
  }
)

.addWithInfo(
  'GridList (with info)',
  `
    Showing portrait thumbs in a grid
  `,
  () => {
    const items = range(100).map((item, i) => {
      return {
        title: faker.name.findName(),
        index: `${i}`,
        image: `${faker.image.imageUrl()}?${i}`
      }
    })
    return (
      <div style={containerStyle}>
        <GridList items={items} scrollable showInfo onSelect={action('Select')} />
      </div>
    )
  },
  {
    propTables: [GridList],
    role: 'part:@sanity/components/lists/grid'
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
      <DefaultListItem title={faker.name.findName()} index="2" onClick={action('Click')} />
    )
  },
  {
    propTables: [DefaultListItem],
    role: 'part:@sanity/components/lists/items/default'
  }
)
.addWithInfo(
  'GridItem',
  `
    The default fieldset is used to gather a collection of fields.
  `,
  () => {
    return (
      <GridItem title={faker.name.findName()} index="1" image={`${faker.image.avatar()}?1`} onClick={action('Click')} />
    )
  },
  {
    propTables: [GridItem],
    role: 'part:@sanity/components/lists/items/grid'
  }
)
.addWithInfo(
  'Grid with info',
  `
    The default fieldset is used to gather a collection of fields.
  `,
  () => {
    return (
      <div style={{width: '300px'}}>
        <GridItem
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
    propTables: [GridItem],
    role: 'part:@sanity/components/lists/items/grid'
  }
)
