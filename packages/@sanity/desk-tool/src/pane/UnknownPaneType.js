import React from 'react'
import PropTypes from 'prop-types'
import DefaultPane from 'part:@sanity/components/panes/default'
import styles from './styles/UnknownPaneType.css'

export default class UnknownPaneType extends React.PureComponent {
  static propTypes = {
    type: PropTypes.string,
    isSelected: PropTypes.bool.isRequired,
    isCollapsed: PropTypes.bool.isRequired,
    onExpand: PropTypes.func,
    onCollapse: PropTypes.func,
    index: PropTypes.number
  }

  static defaultProps = {
    type: undefined,
    onExpand: undefined,
    onCollapse: undefined
  }

  render() {
    const {isSelected, isCollapsed, onCollapse, onExpand, type} = this.props

    return (
      <DefaultPane
        title="Unknown pane type"
        index={this.props.index}
        isSelected={isSelected}
        isCollapsed={isCollapsed}
        onCollapse={onCollapse}
        onExpand={onExpand}
      >
        <div className={styles.root}>
          <p>
            {type ? (
              <span>
                Structure item of type <code>{type}</code> is not a known entity.
              </span>
            ) : (
              <span>
                Structure item is missing required <code>type</code> property.
              </span>
            )}
          </p>
        </div>
      </DefaultPane>
    )
  }
}
