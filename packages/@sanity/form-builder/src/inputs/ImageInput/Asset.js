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
import TrashIcon from 'react-icons/lib/md/delete'
import LinkIcon from 'part:@sanity/base/link-icon'
import MoreVertIcon from 'part:@sanity/base/more-vert-icon'

import {get} from 'lodash'

export default class Asset extends React.PureComponent {
  static propTypes = {
    asset: PropTypes.shape({
      _id: PropTypes.string,
      referenceCount: PropTypes.number,
      url: PropTypes.string
    }),
    onClick: PropTypes.func,
    onKeyPress: PropTypes.func,
    onDeleteComplete: PropTypes.func
  }

  state = {
    showDialog: false,
    isDeleting: false,
    dialogType: undefined
  }

  handleDeleteAsset = asset => {
    const {onDeleteComplete} = this.props
    this.setState({isDeleting: true})

    return client
      .delete(asset._id)
      .then(() => {
        this.setState({
          showDialog: false,
          isDeleting: false
        })
        onDeleteComplete()
      })
      .catch(err => {
        this.setState({
          showDialog: true,
          isDeleting: false,
          dialogType: 'cantDelete'
        })
        // eslint-disable-next-line
        console.error('Could not delete asset', err)
      })
  }

  handleDialogClose = () => {
    this.setState({
      showDialog: false,
      isDeleting: false
    })
  }

  handleMenuAction = action => {
    if (action.name === 'delete') {
      this.handleDeleteAsset(this.props.asset)
    }
    if (action.name === 'showRefs') {
      this.setState({
        showDialog: true,
        dialogType: 'showRefs'
      })
    }
  }

  handleDialogAction = action => {
    if (action.name === 'close') {
      this.handleDialogClose()
    }

    if (action.name === 'delete') {
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
    const actions = []

    if (dialogType != 'cantDelete') {
      actions.push({name: 'delete', title: 'Delete', icon: TrashIcon, color: 'danger'})
    }

    actions.push({
      name: 'close',
      title: 'Close'
    })

    return actions
  }

  render() {
    const {asset, onClick, onKeyPress} = this.props
    const {isDeleting, showDialog, dialogType} = this.state
    const size = 75
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
          src={`${asset.url}?h=100`}
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
          {showDialog && (
            <Dialog
              title={
                dialogType === 'cantDelete' ? 'Could not delete asset' : 'Documents using this'
              }
              color={dialogType === 'cantDelete' ? 'danger' : undefined}
              onClose={this.handleDialogClose}
              onAction={this.handleDialogAction}
              actions={this.getDialogActions(dialogType)}
            >
              <DialogContent size="medium">
                <div className={styles.dialogContent}>
                  <img src={`${asset.url}?w=200`} style={{maxWidth: '200px'}} />
                  <WithReferringDocuments id={asset._id}>
                    {({isLoading, referringDocuments}) =>
                      isLoading ? (
                        <Spinner>Loading…</Spinner>
                      ) : (
                        <div>
                          {referringDocuments.length === 0 ? (
                            <div>No documents are referencing this asset</div>
                          ) : (
                            <>
                              {dialogType === 'cantDelete' && (
                                <p className={styles.dialoigSubtitle}>
                                  Documents using this asset:
                                </p>
                              )}
                              <List>
                                {referringDocuments.map(doc => {
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
                    }
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
