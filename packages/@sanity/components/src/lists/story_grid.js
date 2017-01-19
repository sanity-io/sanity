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

// const defaultItems = range(100).map((item, i) => {
//   return {
//     key: `${i}`,
//     title: chance.name()
//   }
// })

// const detailedItems = range(100).map((item, i) => {
//   const width = random(10, 100) * 10
//   const height = random(10, 50) * 10
//   const randomImage = `http://placekitten.com/${width}/${height}`
//   return {
//     key: `${i}`,
//     title: chance.name(),
//     subtitle: chance.sentence(),
//     description: chance.paragraph(),
//     mediaRender() {
//       return (
//         <img src={randomImage} />
//       )
//     }
//   }
// })

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

.addWithInfo(
  'MediaPreview',
  `
    Showing landscape thumbs in a grid
  `,
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
      <GridList items={items} onSelect={action('Select')} />
    )
  },
  {
    propTables: [GridList],
    role: 'part:@sanity/components/lists/grid'
  }
)

.addWithInfo(
  'MediaPreview (sortable)',
  `
    Showing landscape thumbs in a grid
  `,
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
      <SortableComponent
        items={items}
        onSelect={action('Select')}
        onSortEnd={action('onSortEnd')}
      />
    )
  },
  {
    propTables: [GridList],
    role: 'part:@sanity/components/lists/grid'
  }
)


.addWithInfo(
  'MediaPreview (sortable, scrollable)',
  `
    Showing landscape thumbs in a grid
  `,
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
      <div style={containerStyle}>
        <SortableComponent
          items={items}
          onSelect={action('Select')}
          onSortEnd={action('onSortEnd')}
          scrollable
        />
      </div>
    )
  },
  {
    propTables: [GridList],
    role: 'part:@sanity/components/lists/grid'
  }
)

.addWithInfo(
  'MediaPreview (masonry)',
  `
    Showing landscape thumbs in a grid
  `,
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
      <GridList items={items} onSelect={action('Select')} layout="masonry" renderItem={renderItem} />
    )
  },
  {
    propTables: [GridList],
    role: 'part:@sanity/components/lists/grid'
  }
)

.addWithInfo(
  'Cards',
  `
    Showing landscape thumbs in a grid
  `,
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
      <GridList
        items={items}
        onSelect={action('Select')}
        onSortEnd={action('onSortEnd')}
        renderItem={renderItem}
      />
    )
  },
  {
    propTables: [GridList],
    role: 'part:@sanity/components/lists/grid'
  }
)


.addWithInfo(
  'Cards (masonry)',
  `
    Showing landscape thumbs in a grid
  `,
  () => {

    const items = range(50).map((item, i) => {
      const width = random(10, 100) * 10
      const height = random(10, 33) * 10
      const randomImage = `http://placekitten.com/${width}/${height}`
      return {
        key: `${i}`,
        title: chance.name(),
        subtitle: chance.sentence(),
        description: chance.paragraph(),
        imageUrl: randomImage,
        imageAspect: width / height
      }
    })
    const renderItem = function (item, i) {
      return <CardPreview item={item} aspect={item.imageAspect} />
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
