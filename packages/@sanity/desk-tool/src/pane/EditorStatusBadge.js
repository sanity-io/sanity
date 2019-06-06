/* eslint-disable complexity */
import React from 'react'
import PropTypes from 'prop-types'
import Button from 'part:@sanity/components/buttons/default'
import styles from './styles/Editor.css'

export default class EditorStatusBadge extends React.PureComponent {
  static propTypes = {
    isDraft: PropTypes.bool,
    isPublished: PropTypes.bool,
    onClick: PropTypes.func,
    title: PropTypes.string,
    liveEdit: PropTypes.bool,
    isPublishedRev: PropTypes.bool,
    historyStatus: PropTypes.oneOf(['published', 'edited', 'unpublished', 'created'])
  }

  render() {
    const {
      isDraft,
      isPublished,
      onClick,
      title,
      liveEdit,
      historyStatus,
      isPublishedRev
    } = this.props

    if (historyStatus && isPublishedRev) {
      return (
        <Button inverted={!isPublishedRev} padding="none" onClick={onClick} color="success">
          <span className={styles.badgeText}>{historyStatus}</span>
        </Button>
      )
    }

    if (historyStatus === 'unpublished') {
      return (
        <Button inverted={!isPublishedRev} padding="none" onClick={onClick} color="danger">
          <span className={styles.badgeText}>{historyStatus}</span>
        </Button>
      )
    }

    if (historyStatus) {
      return null
    }

    return (
      <>
        {liveEdit ? (
          <Button color="success" padding="none">
            <span className={styles.badgeText}>Live</span>
          </Button>
        ) : (
          <>
            {!isDraft && !isPublished && (
              <Button inverted padding="none">
                <span className={styles.badgeText}>Creating</span>
              </Button>
            )}
            {isDraft && onClick && (
              <Button inverted padding="none" onClick={onClick}>
                <span className={styles.badgeText}>Draft</span>
              </Button>
            )}
            {isPublished && (
              <Button
                padding="none"
                color={isDraft ? 'warning' : 'success'}
                onClick={onClick}
                title={title}
              >
                <span className={styles.badgeText}>Published</span>
              </Button>
            )}
          </>
        )}
      </>
    )
  }
}
