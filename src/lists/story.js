/* eslint-disable react/no-multi-comp */
import React from 'react'
import {storiesOf, action} from 'part:@sanity/storybook'

import DefaultList from 'part:@sanity/components/lists/default'
import SortableList from 'part:@sanity/components/lists/sortable'
import GridList from 'part:@sanity/components/lists/grid'
import CardPreview from 'part:@sanity/components/previews/card'
import {arrayMove} from 'react-sortable-hoc'

import {range, random} from 'lodash'
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

class SortableComponent extends React.Component {
  constructor(props, args) {
    super(props, args)
    this.state = {
      items: defaultItems
    }
  }

  handleOnSort = () => {
    // console.log('on sort')
  }

  handleOnSortEnd = ({oldIndex, newIndex}) => {
    const {items} = this.state
    this.setState({
      items: arrayMove(items, oldIndex, newIndex)
    })
  }

  render() {
    const {items} = this.state
    return (
      <SortableList items={items} onSort={this.handleOnSort} onSortEnd={this.handleOnSortEnd} useDragHandle="true" />
    )
  }
}


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
  'SortableList',
  `
    Sortable list
  `,
  () => {
    return (
      <div style={containerStyle}>
        <SortableComponent />
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
        mediaRender() {
          return (
            <img src={`${faker.image.imageUrl(150, 100)}?${i}`} />
          )
        }
      }
    })
    return (
      <GridList items={items} onSelect={action('Select')} />
    )
  },
  {
    propTables: [GridList],
    role: 'part:@sanity/components/lists/grid'
  }
)

.addWithInfo(
  'GridList (cards masonry)',
  `
    Showing landscape thumbs in a grid
  `,
  () => {

    const items = range(100).map((item, i) => {
      const fakerImage = faker.image.imageUrl(random(10, 50) * 10, random(10, 30) * 10)
      return {
        key: `${i}`,
        title: faker.name.findName(),
        subtitle: faker.name.findName(),
        description: faker.lorem.paragraphs(2),
        mediaRender() {
          return (
            <img src={`${fakerImage}?${i}`} />
          )
        }
      }
    })
    const renderItem = function (item, i) {
      return <CardPreview item={item} />
    }
    return (
      <GridList items={items} layout="masonry" onSelect={action('Select')} renderItem={renderItem} />
    )
  },
  {
    propTables: [GridList],
    role: 'part:@sanity/components/lists/grid'
  }
)
