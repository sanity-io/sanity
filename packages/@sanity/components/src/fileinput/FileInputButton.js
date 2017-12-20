import PropTypes from 'prop-types'
import React from 'react'

import FakeButton from 'part:@sanity/components/buttons/fake'
import FileInput from 'part:@sanity/components/fileinput/default'

export default class FileInputButton extends React.PureComponent {
  static propTypes = {
    children: PropTypes.node
  }
  render() {
    return (
      <FakeButton>
        <div style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0}}>
          <FileInput {...this.props} style={{height: '100%', width: '100%', display: 'block'}}>
            {this.props.children}
          </FileInput>
        </div>
        {this.props.children}
      </FakeButton>
    )
  }
}
