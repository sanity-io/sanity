import React from 'react'
import PropTypes from 'prop-types'
import Spinner from 'part:@sanity/components/loading/spinner'
import Button from 'part:@sanity/components/buttons/default'
import styles from './styles/Asset.css'
import TrashIcon from 'react-icons/lib/md/delete'
import {get} from 'lodash'

export default class Asset extends React.PureComponent {
  static propTypes = {
    asset: PropTypes.shape({
      _id: PropTypes.string,
      referenceCount: PropTypes.number,
      url: PropTypes.string
    }),
    onClick: PropTypes.func,
    onKeyPress: PropTypes.func
  }

  state = {
    isDeleting: false
  }

  handleDeleteClick = () => {
    const {onDelete, asset} = this.props
    this.setState({isDeleting: true})
    onDelete(asset)
  }

  render() {
    const {asset, onClick, onKeyPress} = this.props
    const {isDeleting} = this.state
    const size = 75
    const width = get(asset, 'metadata.dimensions.width') || 100
    const height = get(asset, 'metadata.dimensions.height') || 100

    return (
      <a
        className={styles.item}
        data-id={asset._id}
        tabIndex={0}
        style={{
          width: `${(width * size) / height}px`,
          flexGrow: `${(width * size) / height}`
        }}
      >
        <i className={styles.padder} style={{paddingBottom: `${(height / width) * 100}%`}} />
        {/* We can not determine an alt text on image */}
        <img src={`${asset.url}?h=100`} className={styles.image} />
        {isDeleting && (
          <div className={styles.spinnerContainer}>
            <Spinner center />
          </div>
        )}
        {asset.referenceCount === 0 && (
          <div className={styles.deleteContainer}>
            <Button
              color="danger"
              onClick={this.handleDeleteClick}
              title="Delete unused image"
              icon={TrashIcon}
            />
          </div>
        )}
      </a>
    )
  }
}
