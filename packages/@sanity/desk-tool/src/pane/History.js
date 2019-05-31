import PropTypes from 'prop-types'
import React from 'react'
import HistoryListItem from 'part:@sanity/components/history/list-item'
import CloseIcon from 'part:@sanity/base/close-icon'
import Button from 'part:@sanity/components/buttons/default'
import styles from './styles/History.css'
import {HistoryStore} from '../../../history-store/lib'

const testUsers = [
  {
    displayName: 'Alta Malone',
    email: 'zig@lon.bg',
    identity: '8b44084b-ef14-5b55-9dfe-8a66d46706a7',
    imageUrl: 'https://placeimg.com/64/64/any?359.6818245619542'
  }
]

export default class History extends React.PureComponent {
  static propTypes = {
    onClose: PropTypes.func,
    documentId: PropTypes.string
  }

  componentDidMount() {
    const {documentId} = this.props
    HistoryStore.getHistory(documentId).then(history => {
      console.log(history)
    })
  }

  render() {
    const {onClose} = this.props

    return (
      <div className={styles.root}>
        <div className={styles.header}>
          History
          <Button onClick={onClose} title="Close" icon={CloseIcon} bleed kind="simple" />
        </div>
        <div className={styles.list}>
          <HistoryListItem status="draft" title="test" users={testUsers} isSelected />
          <HistoryListItem status="published" title="test" users={testUsers} />
          <HistoryListItem status="published" title="test" users={testUsers} />
          <HistoryListItem status="unpublished" title="test" users={testUsers} />
          <HistoryListItem status="published" title="test" users={testUsers} />
          <HistoryListItem status="published" title="test" users={testUsers} />
        </div>
      </div>
    )
  }
}
