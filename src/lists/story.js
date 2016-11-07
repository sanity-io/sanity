/* eslint-disable react/no-multi-comp */
import React from 'react'
import {storiesOf, action} from 'part:@sanity/storybook'

import DefaultList from 'part:@sanity/components/lists/default'
import GridList from 'part:@sanity/components/lists/grid'
import CardPreview from 'part:@sanity/components/previews/card'
import {arrayMove} from 'react-sortable-hoc'

import {range, random} from 'lodash'
import Chance from 'chance'
const chance = new Chance()


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
    title: chance.name()
  }
})

const detailedItems = range(100).map((item, i) => {
  const width = random(10, 100) * 10
  const height = random(10, 50) * 10
  const randomImage = `http://placekitten.com/${width}/${height}`
  return {
    key: `${i}`,
    title: chance.name(),
    subtitle: chance.sentence(),
    description: chance.paragraph(),
    mediaRender() {
      return (
        <img src={randomImage} />
      )
    }
  }
})

class SortableComponent extends React.Component {
  static propTypes = DefaultList.propTypes
  constructor(props, args) {
    super(props, args)
    this.state = {
      items: this.props.items
    }
  }

  handleOnSortEnd = ({oldIndex, newIndex}) => {
    const {items} = this.state
    this.setState({
      items: arrayMove(items, oldIndex, newIndex)
    })
    this.props.onSortEnd()
  }

  render() {
    const {items} = this.state
    const {useDragHandle, onSelect, onSortMove} = this.props
    // TODO onSortStart={onSortStart} crashes chrome. Investigate this?
    return (
      <DefaultList
        items={items}
        sortable
        onSelect={onSelect}
        onSortMove={onSortMove}
        onSortEnd={this.handleOnSortEnd}
        useDragHandle={useDragHandle}
      />
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

      <DefaultList
        items={defaultItems}
        onSelect={action('onSelect')}
      />

    )
  },
  {
    propTables: [DefaultList],
    role: 'part:@sanity/components/lists/default'
  }
)

.addWithInfo(
  'Sortable DefaultList',
  `
    Sortable DefaultList
  `,
  () => {
    return (
      <SortableComponent
        items={defaultItems}
        onSelect={action('onSelect')}
        onSortStart={action('onSortStart')}
        onSortMove={action('onSortMove')}
        onSortEnd={action('onSortEnd')}
        useDragHandle
      />
    )
  },
  {
    propTables: [DefaultList],
    role: 'part:@sanity/components/lists/default'
  }
)

.addWithInfo(
  'Sortable DefaultList (detailed)',
  `
    Sortable DefaultList
  `,
  () => {
    return (
      <SortableComponent
        items={detailedItems}
        useDragHandle
        onSelect={action('onSelect')}
        onSortStart={action('onSortStart')}
        onSortMove={action('onSortMove')}
        onSortEnd={action('onSortEnd')}
      />
    )
  },
  {
    propTables: [DefaultList],
    role: 'part:@sanity/components/lists/default'
  }
)

.addWithInfo(
  'Sortable DefaultList (detailed, no draghandle)',
  `
    Sortable DefaultList
  `,
  () => {
    return (
      <SortableComponent
        items={detailedItems}
        onSelect={action('onSelect')}
        onSortStart={action('onSortStart')}
        onSortMove={action('onSortMove')}
        onSortEnd={action('onSortEnd')}
      />
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
          onSelect={action('onSelect')}
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
      const randomImage = `http://lorempixel.com/${300}/${200}?${i}`
      return {
        key: `${i}`,
        title: chance.name(),
        mediaRender() {
          return (
            <img src={randomImage} />
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
      const width = random(10, 100) * 10
      const height = random(10, 50) * 10
      const randomImage = `http://placekitten.com/${width}/${height}`
      return {
        key: `${i}`,
        title: chance.name(),
        subtitle: chance.sentence(),
        description: chance.paragraph(),
        mediaRender() {
          return (
            <img src={randomImage} />
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
