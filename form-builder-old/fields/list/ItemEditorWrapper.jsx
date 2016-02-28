import React from 'react'
import _t from '../../../../lib/translate'._t

export default React.createClass({
  displayName: 'ItemEditorWrapper',
  propTypes: {
    children: React.PropTypes.node,
    title: React.PropTypes.string,
    onCancel: React.PropTypes.func
  },
  render() {
    const {onCancel} = this.props

    return (
      <div className="form-list-item-editor">
        <div className="form-list-item-editor__header">
          <h2 className="form-list-item-editor__title">{this.props.title}</h2>
          {onCancel && (
            <a className="form-list-item-editor__close" onClick={onCancel}>
              <i/>
              <span>{_t('common.close')}</span>
            </a>
          )}
        </div>
        {this.props.children}
      </div>
    )
  }
})
