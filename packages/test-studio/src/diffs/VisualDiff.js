import React from 'react'
import PropTypes from 'prop-types'
import monikai from 'react-json-pretty/dist/monikai'
import JSONPretty from 'react-json-pretty'
import createDiff from './bateson'

export default class VisualDiff extends React.Component {
  static propTypes = {
    originalDocument: PropTypes.object,
    modifiedDocument: PropTypes.object
  }

  render() {
    const {originalDocument, modifiedDocument} = this.props
    const diff = createDiff(originalDocument, modifiedDocument)
    return (
      <div style={{backgroundColor: '#f5ad3d'}}>
        <JSONPretty data={diff} theme={monikai} mainStyle="white-space: pre-wrap" />
      </div>
    )
  }
}
