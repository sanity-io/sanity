/* eslint-disable react/no-multi-comp */
import React from 'react'
import {storiesOf, action} from 'part:@sanity/storybook'

import DefaultList from 'part:@sanity/components/lists/default'
import SortableList from 'part:@sanity/components/lists/sortable'
import DefaultPreview from 'part:@sanity/components/previews/default'

import {arrayMove} from 'react-sortable-hoc'
import {range, random} from 'lodash'
import Chance from 'chance'
const chance = new Chance()

import {withKnobs, boolean, select} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'

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

const defaultRenderItem = item => <DefaultPreview item={item} />

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
    console.log(`${oldIndex} to  ${newIndex}`) // eslint-disable-line
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
      <SortableList
        items={items}
        sortable
        renderItem={defaultRenderItem}
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
.addDecorator(withKnobs)
.add(
  'Default',
  () => {
    return (
      <Sanity part="part:@sanity/components/lists/default" propTables={[DefaultList]}>
        <div style={containerStyle}>
          <DefaultList
            renderItem={defaultRenderItem}
            items={defaultItems}
            decoration={select('decoration', [false, 'zebra-stripes', 'divider'], false)}
            scrollable={boolean('scrollable', false)}
            onSelect={action('onSelect')}
            onSortStart={action('onSortStart')}
            onSortMove={action('onSortMove')}
            onSortEnd={action('onSortEnd')}
          />
        </div>
      </Sanity>
    )
  }
)

.add(
  'Sortable',
  () => {
    return (
      <Sanity part="part:@sanity/components/lists/sortable" propTables={[SortableList]}>
        <div style={containerStyle}>
          <SortableComponent
            items={detailedItems}
            scrollable={boolean('scrollable', false)}
            decoration={select('decoration', [false, 'zebra-stripes', 'divider'], false)}
            useDragHandle={boolean('Use Drag Handle', false)}
            onSelect={action('onSelect')}
            onSortStart={action('onSortStart')}
            onSortMove={action('onSortMove')}
            onSortEnd={action('onSortEnd')}
          />
        </div>
      </Sanity>
    )
  }
)


.add(
  'Detailed',
  // `
  //   Sortable DefaultList
  // `,
  () => {
    return (
      <Sanity part="part:@sanity/components/lists/sortable" propTables={[SortableList]}>
        <SortableComponent
          items={detailedItems}
          useDragHandle
          onSelect={action('onSelect')}
          onSortStart={action('onSortStart')}
          onSortMove={action('onSortMove')}
          onSortEnd={action('onSortEnd')}
          decoration="divider"
        />
      </Sanity>
    )
  }
)


.add(
  'Scrollable, selected item',
  // `
  //   The default fieldset is used to gather a collection of fields.
  // `,
  () => {
    const selectedItem = defaultItems[3]
    return (
      <Sanity part="part:@sanity/components/lists/default" propTables={[DefaultList]}>
        <div style={containerStyle}>
          <DefaultList
            items={defaultItems}
            renderItem={defaultRenderItem}
            selectedItem={selectedItem}
            onSelect={action('onSelect')}
            scrollable
          />
        </div>
      </Sanity>
    )
  }
)

.add(
  'Scrollable, selected item,highlighted item',
  // `
  //   The default fieldset is used to gather a collection of fields.
  // `,
  () => {
    const selectedItem = defaultItems[3]
    const highlightedItem = defaultItems[5]
    return (
      <Sanity part="part:@sanity/components/lists/default" propTables={[DefaultList]}>
        <div style={containerStyle}>
          <DefaultList
            items={defaultItems}
            renderItem={defaultRenderItem}
            selectedItem={selectedItem}
            highlightedItem={highlightedItem}
            onSelect={action('Select')}
            scrollable
          />
        </div>
      </Sanity>
    )
  }
)


.add(
  'Selected item outside view',
  // `
  //   The default fieldset is used to gather a collection of fields.
  // `,
  () => {
    const selectedItem = defaultItems[50]
    return (
      <Sanity part="part:@sanity/components/lists/default" propTables={[DefaultList]}>
        <div style={containerStyle}>
          <DefaultList
            items={defaultItems}
            renderItem={defaultRenderItem}
            selectedItem={selectedItem}
            onSelect={action('Select')}
            scrollable
          />
        </div>
      </Sanity>
    )
  }
)

.add(
  'Highlighted item outside view',
  // `
  //   The default fieldset is used to gather a collection of fields.
  // `,
  () => {
    const highlightedItem = defaultItems[50]
    return (
      <Sanity part="part:@sanity/components/lists/default" propTables={[DefaultList]}>
        <div style={containerStyle}>
          <DefaultList
            items={defaultItems}
            renderItem={defaultRenderItem}
            highlightedItem={highlightedItem}
            onSelect={action('Select')}
            scrollable
          />
        </div>
      </Sanity>
    )
  }
)

.add(
  'Selected item outside view (bottom)',
  // `
  //   The default fieldset is used to gather a collection of fields.
  // `,
  () => {
    const selectedItem = defaultItems[defaultItems.length - 1]
    return (
      <Sanity part="part:@sanity/components/lists/default" propTables={[DefaultList]}>
        <div style={containerStyle}>
          <DefaultList
            items={defaultItems}
            renderItem={defaultRenderItem}
            selectedItem={selectedItem}
            onSelect={action('Select')}
            scrollable
          />
        </div>
      </Sanity>
    )
  }
)
