import PropTypes from 'prop-types'
import React, {useCallback} from 'react'
import {useSelector} from 'react-redux'
import Dialog from 'part:@sanity/components/dialogs/default'
import DialogContent from 'part:@sanity/components/dialogs/content'
import Spinner from 'part:@sanity/components/loading/spinner'
import {List, Item} from 'part:@sanity/components/lists/default'
import {WithReferringDocuments} from 'part:@sanity/base/with-referring-documents'
import Preview from 'part:@sanity/form-builder/preview'
import schema from 'part:@sanity/base/schema'
import LinkIcon from 'part:@sanity/base/link-icon'
import TrashIcon from 'part:@sanity/base/trash-icon'
import {IntentLink} from 'part:@sanity/base/router'
import {assetType} from '../../types'
import styles from './styles/Dialog.css'

const DialogRefs = props => {
  const {asset, onClose, onDelete} = props

  const {byIds} = useSelector(state => state.assets)

  const handleDialogAction = useCallback(action => {
    if (action.callback) {
      action.callback()
    }
  }, [])

  const currentItem = byIds[asset._id]

  if (!currentItem) {
    return null
  }

  const dialogActions = [
    {
      callback: () => onDelete(asset),
      disabled: currentItem.updating,
      color: 'danger',
      icon: TrashIcon,
      title: 'Delete'
    },
    {
      callback: onClose,
      title: 'Close'
    }
  ]

  return (
    <Dialog
      actions={dialogActions}
      onAction={handleDialogAction}
      onClose={onClose}
      title="Documents using this"
    >
      <DialogContent size="medium">
        <div className={styles.dialogContent}>
          <img src={`${asset.url}?w=200`} style={{maxWidth: '200px'}} />

          <WithReferringDocuments id={asset._id}>
            {({isLoading, referringDocuments}) => {
              const drafts = referringDocuments.reduce(
                (acc, doc) => (doc._id.startsWith('drafts.') ? acc.concat(doc._id.slice(7)) : acc),
                []
              )
              const filteredDocuments = referringDocuments.filter(doc => !drafts.includes(doc._id))
              if (isLoading) {
                return <Spinner>Loading…</Spinner>
              }

              if (filteredDocuments.length === 0) {
                return <div>No documents are referencing this asset</div>
              }

              return (
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
              )
            }}
          </WithReferringDocuments>
        </div>
      </DialogContent>
    </Dialog>
  )
}
DialogRefs.propTypes = {
  asset: assetType.isRequired,
  onClose: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
}

export default DialogRefs
