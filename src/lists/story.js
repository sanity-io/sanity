/* eslint-disable react/no-multi-comp */
import React from 'react'
import {storiesOf, action} from 'part:@sanity/storybook'

import DefaultList from 'part:@sanity/components/lists/default'

import {arrayMove} from 'react-sortable-hoc'
import {range, random} from 'lodash'
import Chance from 'chance'
const chance = new Chance()


const containerStyle = {
  width: '90%',
  height: '90%',
  boxShadow: '0 0 10px #999',
  overflow: 'hidden',
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translateX(-50%) translateY(-50%)',
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
    const {useDragHandle, onSelect, decoration, scrollable} = this.props
    // TODO onSortStart={onSortStart} crashes chrome. Investigate this?

    return (
      <DefaultList
        items={items}
        sortable
        scrollable={scrollable}
        onSortEnd={this.handleOnSortEnd}
        onSelect={onSelect}
        useDragHandle={useDragHandle}
        decoration={decoration}
      />
    )
  }
}


storiesOf('List (default)')
.addWithInfo(
  'Default',
  'The default fieldset is used to gather a collection of fields.',
  () => {
    return <DefaultList items={defaultItems} onSelect={action('onSelect')} />
  },
  {
    propTables: [DefaultList],
    role: 'part:@sanity/components/lists/default'
  }
)


.addWithInfo(
  'Zebra-stripes',
  'The default fieldset is used to gather a collection of fields.',
  () => {
    return <DefaultList items={defaultItems} onSelect={action('onSelect')} decoration="zebra-stripes" />
  },
  {
    propTables: [DefaultList],
    role: 'part:@sanity/components/lists/default'
  }
)
.addWithInfo(
  'Divider',
  'The default fieldset is used to gather a collection of fields.',
  () => {
    return <DefaultList items={defaultItems} onSelect={action('onSelect')} decoration="divider" />
  },
  {
    propTables: [DefaultList],
    role: 'part:@sanity/components/lists/default'
  }
)


.addWithInfo(
  'Sortable (divider, scrollable)',
  `
    Sortable DefaultList
  `,
  () => {
    return (
      <div style={containerStyle}>
        <SortableComponent
          items={defaultItems}
          onSelect={action('onSelect')}
          onSortStart={action('onSortStart')}
          onSortMove={action('onSortMove')}
          onSortEnd={action('onSortEnd')}
          useDragHandle
          scrollable
          sortable
          decoration="divider"
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
  'Sortable (detailed, divider)',
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
        decoration="divider"
      />
    )
  },
  {
    propTables: [DefaultList],
    role: 'part:@sanity/components/lists/default'
  }
)

.addWithInfo(
  'Sortable (detailed, no draghandle, zebra-stripes)',
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
        decoration="zebra-stripes"
      />
    )
  },
  {
    propTables: [DefaultList],
    role: 'part:@sanity/components/lists/default'
  }
)

.addWithInfo(
  'Sortable, scrollable',
  `
    Sortable DefaultList
  `,
  () => {
    return (
      <div style={containerStyle}>
        <SortableComponent
          scrollable
          items={defaultItems}
          onSelect={action('onSelect')}
          onSortStart={action('onSortStart')}
          onSortMove={action('onSortMove')}
          onSortEnd={action('onSortEnd')}
          decoration="zebra-stripes"
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
  'Scrollable, selected item',
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
  'Scrollable, sortable',
  `
    The default fieldset is used to gather a collection of fields.
  `,
  () => {
    return (
      <div style={containerStyle}>
        <SortableComponent
          sortable
          scrollable
          useDragHandle
          items={defaultItems}
          onSelect={action('onSelect')}
          onSortStart={action('onSortStart')}
          onSortMove={action('onSortMove')}
          onSortEnd={action('onSortEnd')}
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
  'Scrollable, selected item,highlighted item',
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
  'Selected item outside view',
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
  'Selected item outside view (bottom)',
  `
    The default fieldset is used to gather a collection of fields.
  `,
  () => {
    const selectedItem = defaultItems[defaultItems.length - 1]
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
