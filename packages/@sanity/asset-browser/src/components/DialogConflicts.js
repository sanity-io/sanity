import PropTypes from 'prop-types'
import React, {useCallback} from 'react'
import Dialog from 'part:@sanity/components/dialogs/default'
import DialogContent from 'part:@sanity/components/dialogs/content'
import Spinner from 'part:@sanity/components/loading/spinner'
import {List, Item} from 'part:@sanity/components/lists/default'
import {WithReferringDocuments} from 'part:@sanity/base/with-referring-documents'
import Preview from 'part:@sanity/form-builder/preview'
import schema from 'part:@sanity/base/schema'
import LinkIcon from 'part:@sanity/base/link-icon'
import {IntentLink} from 'part:@sanity/base/router'
import {assetType} from '../../types'
import styles from './styles/Dialog.css'

const DialogConflicts = props => {
  const {asset, onClose} = props

  const dialogActions = [
    {
      callback: onClose,
      title: 'Close'
    }
  ]

  const handleDialogAction = useCallback(action => {
    if (action.callback) {
      action.callback()
    }
  }, [])

  return (
    <Dialog
      actions={dialogActions}
      color="danger"
      onAction={handleDialogAction}
      onClose={onClose}
      title="Could not delete assets"
    >
      <DialogContent size="medium">
        <div className={styles.dialogContent} key={asset._id}>
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
                <div>
                  <div>
                    <h4 className={styles.dialogSubtitle}>
                      {filteredDocuments.length > 1
                        ? `${filteredDocuments.length} documents are using this asset`
                        : 'A document is using this asset'}
                    </h4>
                    <p className={styles.description}>
                      {`Open the document${
                        referringDocuments.length > 1 ? 's' : ''
                      } and remove the asset before deleting it.`}
                    </p>
                  </div>

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
                </div>
              )
            }}
          </WithReferringDocuments>
        </div>
      </DialogContent>
    </Dialog>
  )
}
DialogConflicts.propTypes = {
  asset: assetType.isRequired,
  onClose: PropTypes.func.isRequired
}

export default DialogConflicts
