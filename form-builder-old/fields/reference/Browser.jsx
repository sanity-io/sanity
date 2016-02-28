import React from 'react'
import cx from 'classnames'

export default React.createClass({

  displayName: 'ReferenceBrowser',
  propTypes: {
    items: React.PropTypes.array,
    onSelectItem: React.PropTypes.func.isRequired,
    fieldPreviews: React.PropTypes.object.isRequired,
    selected: React.PropTypes.object
  },

  render() {
    const {items, onSelectItem, fieldPreviews, selected} = this.props

    return (
      <div className="reference-browser reference-browser--small">
        <ul className="reference-browser__items reference-browser__items--list">
          {items.map((item, i) => {
            const FieldPreview = fieldPreviews[item.type] || fieldPreviews.default
            const selectItem = () => {
              onSelectItem(item)
            }

            const classes = cx({
              'reference-browser__item': true,
              [`reference-browser__item--${item.type}`]: true,
              'reference-browser__item--selected': selected && item.id === selected.id
            })
            return (
              <li key={`refItem${i}`} className={classes} onClick={selectItem}>
                <FieldPreview value={item} />
              </li>
            )
          })}
        </ul>
      </div>
    )
  }
})
