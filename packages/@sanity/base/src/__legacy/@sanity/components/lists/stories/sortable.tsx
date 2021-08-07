// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import React from 'react'
import {List, Item, DragHandle} from 'part:@sanity/components/lists/sortable'
import {arrayMove} from 'react-sortable-hoc'
import {range} from 'lodash'
import Chance from 'chance'
import Sanity from 'part:@sanity/storybook/addons/sanity'

const chance = new Chance()

const defaultItems = range(100).map((_, i) => {
  return {
    key: `${i}`,
    title: chance.name(),
  }
})

export function SortableStory() {
  return (
    <Sanity part="part:@sanity/components/lists/sortable" propTables={[List]}>
      <div style={{padding: '2em', maxWidth: 350, margin: 'auto'}}>
        <SortableTester items={defaultItems} />
      </div>
    </Sanity>
  )
}

interface SortableTesterProps {
  items: {key: string; title: string}[]
  onSort?: (params: {oldIndex: number; newIndex: number}) => void
}

interface SortableTesterState {
  items: {key: string; title: string}[]
}

class SortableTester extends React.PureComponent<SortableTesterProps, SortableTesterState> {
  constructor(props: SortableTesterProps) {
    super(props)

    this.state = {
      items: this.props.items.slice(),
    }
  }

  handleOnSort = ({oldIndex, newIndex}: {oldIndex: number; newIndex: number}) => {
    const {items} = this.state

    this.setState({items: arrayMove(items, oldIndex, newIndex)})

    if (this.props.onSort) this.props.onSort({oldIndex, newIndex})
  }

  render() {
    const {items} = this.state

    return (
      <List onSortEnd={this.handleOnSort}>
        {items.map((item, index) => (
          <Item index={index} key={item.key}>
            <div
              style={{
                background: 'var(--card-bg-color)',
                padding: '1em',
                display: 'flex',
                alignItems: 'center',
                boxShadow: '0 0 0 1px var(--card-hairline-soft-color)',
              }}
            >
              <DragHandle style={{fontSize: 25, marginRight: 16}} />
              <div style={{flex: 1, marginTop: -1}}>{item.title}</div>
            </div>
          </Item>
        ))}
      </List>
    )
  }
}
