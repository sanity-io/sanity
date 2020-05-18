import React from 'react'

import {
  List as SortableList,
  Item as SortableItem,
  DragHandle
} from 'part:@sanity/components/lists/sortable'

import {arrayMove} from 'react-sortable-hoc'
import {range} from 'lodash'
import Chance from 'chance'
import Sanity from 'part:@sanity/storybook/addons/sanity'

const chance = new Chance()

const containerStyle = {
  width: '90%',
  height: '90%',
  boxShadow: '0 0 10px #999',
  overflow: 'hidden',
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translateX(-50%) translateY(-50%)'
}

const defaultItems = range(100).map((item, i) => {
  return {
    key: `${i}`,
    title: chance.name()
  }
})

class SortableTester extends React.PureComponent {
  constructor(props, args) {
    super(props, args)
    this.state = {
      items: this.props.items.slice()
    }
  }

  handleOnSort = event => {
    const {items} = this.state
    const {oldIndex, newIndex} = event
    this.setState({
      items: arrayMove(items, oldIndex, newIndex)
    })
    this.props.onSort(event)
  }

  render() {
    const {items} = this.state

    return (
      <SortableList {...this.props} onSort={this.handleOnSort}>
        {items.map((item, index) => {
          return (
            <SortableItem index={index} key={String(index)}>
              <DragHandle />
              {item.title}
            </SortableItem>
          )
        })}
      </SortableList>
    )
  }
}

export function SortableStory() {
  return (
    <Sanity part="part:@sanity/components/lists/sortable" propTables={[SortableList]}>
      <div style={containerStyle}>
        <SortableTester items={defaultItems} />
      </div>
    </Sanity>
  )
}
