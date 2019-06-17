import React from 'react'
import PropTypes from 'prop-types'
import Spinner from 'part:@sanity/components/loading/spinner'
import DropDownButton from 'part:@sanity/components/buttons/dropdown'
import Dialog from 'part:@sanity/components/dialogs/default'
import DialogContent from 'part:@sanity/components/dialogs/content'
import {List, Item} from 'part:@sanity/components/lists/default'
import {WithReferringDocuments} from 'part:@sanity/base/with-referring-documents'
import Preview from '../../Preview'
import schema from 'part:@sanity/base/schema'
import {IntentLink} from 'part:@sanity/base/router'
import client from 'part:@sanity/base/client'

import styles from './styles/Asset.css'
import TrashIcon from 'part:@sanity/base/trash-icon'
import LinkIcon from 'part:@sanity/base/link-icon'
import MoreVertIcon from 'part:@sanity/base/more-vert-icon'

import {get} from 'lodash'

const DIALOG_DELETE_ACTION = {name: 'delete', title: 'Delete', icon: TrashIcon, color: 'danger'}
const DIALOG_CLOSE_ACTION = {name: 'close', title: 'Close'}

export default class Asset extends React.PureComponent {
  static propTypes = {
    asset: PropTypes.shape({
      _id: PropTypes.string,
      referenceCount: PropTypes.number,
      url: PropTypes.string
    }),
    onClick: PropTypes.func,
    onKeyPress: PropTypes.func,
    onDeleteFinished: PropTypes.func.isRequired
  }

  state = {
    isDeleting: false,
    dialogType: undefined
  }

  handleDeleteAsset = asset => {
    const {onDeleteFinished} = this.props
    this.setState({isDeleting: true})
    return client
      .delete(asset._id)
      .then(() => {
        this.setState({
          isDeleting: false
        })
        onDeleteFinished(asset._id)
      })
      .catch(err => {
        this.setState({
          isDeleting: false,
          dialogType: 'error'
        })
        // eslint-disable-next-line
        console.error('Could not delete asset', err)
      })
  }

  handleDialogClose = () => {
    this.setState({
      dialogType: null
    })
  }

  handleMenuAction = action => {
    if (action.name === 'delete') {
      this.handleDeleteAsset(this.props.asset)
    } else if (action.name === 'showRefs') {
      this.setState({
        dialogType: 'showRefs'
      })
    }
  }

  handleDialogAction = action => {
    if (action.name === 'close') {
      this.handleDialogClose()
    } else if (action.name === 'delete') {
      this.handleDeleteAsset(this.props.asset)
    }
  }

  renderMenuItem = item => {
    const {color, title, icon} = item
    const Icon = icon
    return (
      <div className={color === 'danger' ? styles.menuItemDanger : styles.menuItem}>
        {icon && <Icon />}&nbsp;&nbsp;{title}
      </div>
    )
  }

  getDialogActions = dialogType => {
    if (dialogType != 'error') {
      return [DIALOG_DELETE_ACTION, DIALOG_CLOSE_ACTION]
    }

    return [DIALOG_CLOSE_ACTION]
  }

  render() {
    const {asset, onClick, onKeyPress} = this.props
    const {isDeleting, dialogType} = this.state
    const size = 75
    const dpi =
      typeof window === 'undefined' || !window.devicePixelRatio
        ? 1
        : Math.round(window.devicePixelRatio)

    const imgH = 100 * Math.max(1, dpi)
    const width = get(asset, 'metadata.dimensions.width') || 100
    const height = get(asset, 'metadata.dimensions.height') || 100

    const menuItems = [
      {
        name: 'showRefs',
        title: 'Show documents using this',
        icon: LinkIcon
      },
      {
        name: 'delete',
        title: 'Delete',
        color: 'danger',
        icon: TrashIcon
      }
    ]

    return (
      <a
        className={styles.item}
        tabIndex={0}
        data-id={asset._id}
        onKeyPress={onKeyPress}
        style={{
          width: `${(width * size) / height}px`,
          flexGrow: `${(width * size) / height}`
        }}
      >
        <i className={styles.padder} style={{paddingBottom: `${(height / width) * 100}%`}} />
        {/* We can not determine an alt text on image */}
        <img
          src={`${asset.url}?h=${imgH}&fit=max`}
          className={styles.image}
          onClick={onClick}
          data-id={asset._id}
        />
        {isDeleting && (
          <div className={styles.spinnerContainer}>
            <Spinner center />
          </div>
        )}
        <div className={styles.menuContainer}>
          <DropDownButton
            placement="bottom-end"
            showArrow={false}
            items={menuItems}
            renderItem={this.renderMenuItem}
            onAction={this.handleMenuAction}
          >
            <MoreVertIcon />
          </DropDownButton>
          {dialogType && (
            <Dialog
              title={dialogType === 'error' ? 'Could not delete asset' : 'Documents using this'}
              color={dialogType === 'error' ? 'danger' : undefined}
              onClose={this.handleDialogClose}
              onAction={this.handleDialogAction}
              actions={this.getDialogActions(dialogType)}
            >
              <DialogContent size="medium" key={dialogType}>
                <div className={styles.dialogContent}>
                  <img src={`${asset.url}?w=200`} style={{maxWidth: '200px'}} />
                  <WithReferringDocuments id={asset._id}>
                    {({isLoading, referringDocuments}) => {
                      const drafts = referringDocuments.reduce(
                        (acc, doc) =>
                          doc._id.startsWith('drafts.') ? acc.concat(doc._id.slice(7)) : acc,
                        []
                      )

                      const filteredDocuments = referringDocuments.filter(
                        doc => !drafts.includes(doc._id)
                      )

                      if (isLoading) {
                        return <Spinner>Loading…</Spinner>
                      }

                      return (
                        <div>
                          {filteredDocuments.length === 0 ? (
                            <div>No documents are referencing this asset</div>
                          ) : (
                            <>
                              {dialogType === 'error' && (
                                <div>
                                  <h4 className={styles.dialogSubtitle}>
                                    {filteredDocuments.length > 1
                                      ? `${filteredDocuments.length} documents are using this asset`
                                      : 'A document is using this asset'}
                                  </h4>
                                  <p className={styles.referringDocumentsDescription}>
                                    {`Open the document${
                                      referringDocuments.length > 1 ? 's' : ''
                                    } and remove the asset before deleting it.`}
                                  </p>
                                </div>
                              )}
                              <List>
                                {filteredDocuments.map(doc => {
                                  return (
                                    <Item key={doc._id}>
                                      <IntentLink
                                        intent="edit"
                                        params={{id: doc._id}}
                                        key={doc._id}
                                        className={styles.intentLink}
                                      >
                                        <Preview value={doc} type={schema.get(doc._type)} />
                                        <span className={styles.openDocLink}>
                                          <LinkIcon /> Open
                                        </span>
                                      </IntentLink>
                                    </Item>
                                  )
                                })}
                              </List>
                            </>
                          )}
                        </div>
                      )
                    }}
                  </WithReferringDocuments>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </a>
    )
  }
}
