import React from 'react'
import cx from 'classnames'

export default React.createClass({
  displayName: 'DocumentPreview',
  render() {
    const {document} = this.props
    const classes = cx({
      'document-preview': true
    })
    return (
      <div className={classes}>
        {JSON.stringify(document)}
      </div>
    )
  }
})
