/* eslint-disable complexity */
import React from 'react'
import PropTypes from 'prop-types'
import Badge from 'part:@sanity/components/badges/default'

export default class EditorStatusBadge extends React.PureComponent {
  static propTypes = {
    isDraft: PropTypes.bool,
    isPublished: PropTypes.bool,
    title: PropTypes.string,
    liveEdit: PropTypes.bool
  }

  render() {
    const {isDraft, isPublished, title, liveEdit} = this.props
    return (
      <>
        {liveEdit ? (
          <Badge color="danger">Live</Badge>
        ) : (
          <>
            {!isDraft && !isPublished && (
              <Badge inverted faded>
                Draft
              </Badge>
            )}
            {isPublished && (
              <Badge color="success" title={title}>
                Published
              </Badge>
            )}
            {isDraft && (
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
