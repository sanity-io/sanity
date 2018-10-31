import PropTypes from 'prop-types'
import React from 'react'
import {IntentLink} from 'part:@sanity/base/router'
import Dialog from 'part:@sanity/components/dialogs/default'
import FileIcon from 'part:@sanity/base/file-icon'
import styles from './styles/ActionModal.css'
import DialogContent from 'part:@sanity/components/dialogs/content'
import Ink from 'react-ink'

function ActionModal(props) {
  return (
    <Dialog className={styles.modal} onClose={props.onClose} isOpen>
      <DialogContent size="large" padding="medium">
        <h1 className={styles.title}>Create new</h1>
        <ul className={styles.list}>
          {props.actions.map(action => {
            const Icon = action.icon
            return (
              <li className={styles.listItem} key={action.title}>
                <IntentLink
                  onClick={props.onClose}
                  className={styles.actionLink}
                  intent="create"
                  params={action.params}
                >
                  <span className={styles.icon}>{Icon ? <Icon /> : <FileIcon />}</span>
                  <span>{action.title}</span>
                  <Ink duration={1000} opacity={0.1} radius={200} />
                </IntentLink>
              </li>
            )
          })}
        </ul>
      </DialogContent>
    </Dialog>
  )
}

ActionModal.defaultProps = {
  title: 'Create',
  actions: []
}

ActionModal.propTypes = {
  title: PropTypes.string,
  actions: PropTypes.array,
  onClose: PropTypes.func.isRequired
}

export default ActionModal
