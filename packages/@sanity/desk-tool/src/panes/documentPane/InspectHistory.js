/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable react/jsx-filename-extension */

import React from 'react'
import PropTypes from 'prop-types'
import Spinner from 'part:@sanity/components/loading/spinner'
import InspectView from './InspectView'

export default class InspectHistory extends React.PureComponent {
  static propTypes = {
    document: PropTypes.shape({
      isLoading: PropTypes.bool.isRequired,
      snapshot: PropTypes.shape({_type: PropTypes.string})
    }).isRequired,
    onClose: PropTypes.func.isRequired
  }

  render() {
    const {onClose, document} = this.props
    const {isLoading, snapshot} = document
    return isLoading ? <Spinner /> : <InspectView value={snapshot} onClose={onClose} />
  }
}
