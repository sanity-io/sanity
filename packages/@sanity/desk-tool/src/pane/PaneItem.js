import React, {PropTypes} from 'react'
import styles from './styles/PaneItem.css'
import {StateLink} from 'part:@sanity/base/router'
import DefaultPreview from 'part:@sanity/components/previews/default'
import MediaPreview from 'part:@sanity/components/previews/media'
import DetailPreview from 'part:@sanity/components/previews/detail'
import CardPreview from 'part:@sanity/components/previews/card'

class PaneItem extends React.Component {
  render() {
    const {selected, item, view, linkState} = this.props
    const className = `
      ${selected ? styles.selected : styles.unSelected}
      ${styles[`view--${view}`]}
    `
    // const width = random(10, 100) * 10
    // const height = random(10, 50) * 10
    // const randomImage = `http://placekitten.com/${width}/${height}`
    const previewItem = {
      title: item.name
      // subtitle: 'This is a test subtitle',
      // description: 'This is the description of something. I can write some stuff here, and that is good.',
      // mediaRender() {
      //   return (
      //     <img src={randomImage} width={width} height={height} />
      //   )
      // }
    }

    return (
      <li className={className} key={item._id}>
        <StateLink
          state={linkState}
          className={selected ? styles.selectedLink : styles.link}
        >
          {
            view == 'list' && <DefaultPreview item={previewItem} />
          }
          {
            view == 'thumbnails' && <MediaPreview item={previewItem} />
          }
          {
            view == 'cards' && <CardPreview item={previewItem} />
          }
          {
            view == 'details' && <DetailPreview item={previewItem} />
          }
        </StateLink>
      </li>
    )
  }
}

PaneItem.propTypes = {
  renderItem: PropTypes.func,
  selected: PropTypes.bool,
  item: PropTypes.object,
  index: PropTypes.number,
  className: PropTypes.string,
  view: PropTypes.oneOf(['list', 'thumbnails', 'cards', 'details']),
  selectedType: PropTypes.string,
  selectedDocumentId: PropTypes.string,
  linkState: PropTypes.object
}

export default PaneItem
