/* eslint-disable react/no-multi-comp */
import React from 'react'
import {storiesOf, action} from 'part:@sanity/storybook'

import DefaultList from 'part:@sanity/components/lists/default'
import GridList from 'part:@sanity/components/lists/grid'
import CardPreview from 'part:@sanity/components/previews/card'
import MediaPreview from 'part:@sanity/components/previews/media'

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
      <GridList
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

storiesOf('List (grid)')
.addDecorator(withKnobs)
.add(
  'MediaPreview',
  () => {
    const items = range(50).map((item, i) => {
      const width = random(10, 80) * 10
      const height = random(10, 50) * 10
      const randomImage = `http://placekitten.com/${width}/${height}`
      return {
        key: `${i}`,
        title: chance.name(),
        imageUrl: randomImage,
        aspect: width / height
      }
    })
    return (
      <Sanity part="part:@sanity/components/lists/grid" propTables={[GridList]}>
        <GridList items={items} onSelect={action('Select')} />
      </Sanity>
    )
  }
)

.add(
  'MediaPreview (sortable)',
  () => {
    const items = range(50).map((item, i) => {
      const width = random(10, 80) * 10
      const height = random(10, 50) * 10
      const randomImage = `http://placekitten.com/${width}/${height}`
      return {
        key: `${i}`,
        title: chance.name(),
        imageUrl: randomImage,
        aspect: width / height
      }
    })
    return (
      <Sanity part="part:@sanity/components/lists/grid" propTables={[GridList]}>
        <div style={containerStyle}>
          <SortableComponent
            items={items}
            onSelect={action('Select')}
            onSortEnd={action('onSortEnd')}
            scrollable={boolean('scrollable', false)}
          />
        </div>
      </Sanity>
    )
  },
  {
    propTables: [GridList],
    role: 'part:@sanity/components/lists/grid'
  }
)

.add(
  'MediaPreview (masonry)',
  () => {
    const items = range(50).map((item, i) => {
      const width = random(10, 80) * 10
      const height = random(10, 30) * 10
      const randomImage = `http://placekitten.com/${width}/${height}`
      return {
        key: `${i}`,
        title: chance.name(),
        imageUrl: randomImage,
        aspect: width / height
      }
    })
    const renderItem = function (item, i) {
      return <MediaPreview item={item} aspect={item.aspect} />
    }
    return (
      <Sanity part="part:@sanity/components/lists/grid" propTables={[GridList]}>
        <GridList
          items={items}
          onSelect={action('Select')}
          layout={select('layoyt', ['masonry', false], 'masonry')}
          renderItem={renderItem}
        />
      </Sanity>
    )
  },
  {
    propTables: [GridList],
    role: 'part:@sanity/components/lists/grid'
  }
)

.add(
  'Cards',
  () => {

    const items = range(50).map((item, i) => {
      const width = 300
      const height = 120
      const randomImage = `http://placekitten.com/${width}/${height}`
      return {
        key: `${i}`,
        title: chance.name(),
        subtitle: chance.sentence(),
        description: chance.sentence(1),
        media: <img src={randomImage} height={height} width={width} />
      }
    })
    const renderItem = function (item, i) {
      return <CardPreview item={item} />
    }

    return (
      <Sanity part="part:@sanity/components/lists/grid" propTables={[GridList]}>
        <GridList
          items={items}
          layout={select('Layout', ['masonry', false], 'masonry')}
          onSelect={action('Select')}
          onSortEnd={action('onSortEnd')}
          renderItem={renderItem}
        />
      </Sanity>
    )
  }
)
