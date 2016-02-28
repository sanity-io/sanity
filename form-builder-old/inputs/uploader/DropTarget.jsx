
import React from 'react'
import cx from 'classnames'

export default React.createClass({
  displayName: 'DropTarget',
  propTypes: {
    multiple: React.PropTypes.bool,
    onSelectFiles: React.PropTypes.func
  },

  getInitialState() {
    return {canDrop: false}
  },

  handleDrag(e) {
    //const files = e.dataTransfer.files;
    // Todo: fix: this is borked. e.dataTransfer.files.length is always zero
    //const canDrop = files && (files.length == 1 || this.props.multiple);
    const canDrop = true
    this.setState({canDrop: canDrop})
    if (canDrop) {
      e.preventDefault()
    }
  },

  handleDragLeave(e) {
    e.preventDefault()
    this.setState({canDrop: false})
  },

  handleDrop(e) {
    e.preventDefault()
    this.props.onSelectFiles(this.props.multiple ? e.dataTransfer.files : [e.dataTransfer.files[0]])
    this.setState({canDrop: false})
  },

  render() {
    const classes = cx({
      [this.props.className]: true,
      'file-drop': true,
      'can-drop': this.state.canDrop
    })
    return (
        <div {...this.props}
          className={classes}
          onDragOver={this.handleDrag}
          onDragEnter={this.handleDrag}
          onDrop={this.handleDrop}
          onDragLeave={this.handleDragLeave}>
            {this.props.children}
        </div>
    )
  }
})
