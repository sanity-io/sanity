/* eslint-disable complexity */
import React from 'react'
import PropTypes from 'prop-types'
import Badge from 'part:@sanity/components/badges/default'

export default class EditorStatusBadge extends React.PureComponent {
  static propTypes = {
    isDraft: PropTypes.bool,
    isPublished: PropTypes.bool,
    onClick: PropTypes.func,
    title: PropTypes.string,
    liveEdit: PropTypes.bool,
    isPublishedRev: PropTypes.bool,
    historyStatus: PropTypes.oneOf([
      'published',
      'edited',
      'unpublished',
      'created',
      'discardDraft',
      'truncated'
    ])
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

    if (historyStatus && historyStatus === 'published' && isPublishedRev) {
      return (
        <Badge inverted={!isPublishedRev} color="success">
          {historyStatus}
        </Badge>
      )
    }

    if (historyStatus === 'unpublished') {
      return (
        <Badge inverted={!isPublishedRev} color="danger">
          {historyStatus}
        </Badge>
      )
    }

    if (historyStatus) {
      return null
    }

    return (
      <>
        {liveEdit ? (
          <Badge color="success" inverted>
            Live
          </Badge>
        ) : (
          <>
            {!isDraft && !isPublished && <Badge inverted>Creating</Badge>}
            {isPublished && (
              <Badge color="success" title={title}>
                Published
              </Badge>
            )}
            {isDraft && onClick && (
              <Badge inverted color="neutral">
                Draft
              </Badge>
            )}
          </>
        )}
      </>
    )
  }
}
