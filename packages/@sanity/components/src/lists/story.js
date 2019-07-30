/* eslint-disable react/no-multi-comp */
import React from 'react'
import {storiesOf, action} from 'part:@sanity/storybook'

import {List as DefaultList, Item as DefaultItem} from 'part:@sanity/components/lists/default'
import {
  List as SortableList,
  Item as SortableItem,
  DragHandle
} from 'part:@sanity/components/lists/sortable'

import {arrayMove} from 'react-sortable-hoc'
import {range, random} from 'lodash'
import Chance from 'chance'
import {withKnobs, number} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import CreateDocumentList from 'part:@sanity/components/lists/create-document'
import FileIcon from 'part:@sanity/base/file-icon'

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

class SortableTester extends React.Component {
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
            <SortableItem index={index} key={index}>
              <DragHandle />
              {item.title}
            </SortableItem>
          )
        })}
      </SortableList>
    )
  }
}

storiesOf('List')
  .addDecorator(withKnobs)
  .add('Default', () => {
    return (
      <Sanity part="part:@sanity/components/lists/default" propTables={[DefaultList]}>
        <div style={containerStyle}>
          <DefaultList>
            {defaultItems.map((item, index) => {
              return <DefaultItem key={index}>{item.title}</DefaultItem>
            })}
          </DefaultList>
        </div>
      </Sanity>
    )
  })
  .add('Sortable', () => {
    return (
      <Sanity part="part:@sanity/components/lists/sortable" propTables={[SortableList]}>
        <div style={containerStyle}>
          <SortableTester items={defaultItems} />
        </div>
      </Sanity>
    )
  })
  .add('Create document', () => {
    const templateChoices = range(number('# Choices', 5, 'test')).map((choice, i) => {
      return {
        id: `${i}`,
        title: chance.animal(),
        subtitle: 'test',
        template: 'test',
        icon: FileIcon
      }
    })

    return (
      <Sanity
        part="part:@sanity/components/lists/create-document"
        propTables={[CreateDocumentList]}
      >
        <CreateDocumentList templateChoices={templateChoices} />
      </Sanity>
    )
  })
