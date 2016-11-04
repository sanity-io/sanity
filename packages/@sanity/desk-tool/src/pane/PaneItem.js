import React, {PropTypes} from 'react'
import styles from './styles/PaneItem.css'
import {StateLink} from 'part:@sanity/base/router'
import DefaultPreview from 'part:@sanity/components/previews/default'
import MediaPreview from 'part:@sanity/components/previews/media'
import DetailPreview from 'part:@sanity/components/previews/detail'
import CardPreview from 'part:@sanity/components/previews/card'
// import {random} from 'lodash'

class PaneItem extends React.Component {
  render() {
    const {selected, item, listView, linkState} = this.props
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
      <div
        className={selected ? styles.selectedItem : styles.item}
        key={item._id}
      >
        <StateLink state={linkState} className={styles.stateLink}>
          {
            listView == 'default' && <DefaultPreview item={previewItem} />
          }
          {
            listView == 'thumbnails' && <MediaPreview item={previewItem} />
          }
          {
            listView == 'cards' && <CardPreview item={previewItem} />
          }
          {
            listView == 'details' && <DetailPreview item={previewItem} />
          }
        </StateLink>
      </div>
    )
  }
}

PaneItem.propTypes = {
  renderItem: PropTypes.func,
  selected: PropTypes.bool,
  item: PropTypes.object,
  index: PropTypes.number,
  className: PropTypes.string,
  listView: PropTypes.oneOf(['default', 'thumbnails', 'cards', 'details']),
  selectedType: PropTypes.string,
  selectedDocumentId: PropTypes.string,
  linkState: PropTypes.object
}

PaneItem.defaultProps = {
  listView: 'default'
}

export default PaneItem
