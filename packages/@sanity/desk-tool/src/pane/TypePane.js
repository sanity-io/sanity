import PropTypes from 'prop-types'
import React from 'react'
import styles from './styles/TypePane.css'
import {withRouterHOC} from 'part:@sanity/base/router'
import Pane from 'part:@sanity/components/panes/default'
import TypePaneItem from './TypePaneItem'
import contentStylesOverride from './styles/contentStylesOverride.css'

export default withRouterHOC(
  class TypePane extends React.PureComponent {
    static propTypes = {
      items: PropTypes.array, // eslint-disable-line react/forbid-prop-types
      router: PropTypes.shape({
        state: PropTypes.object
      })
    }

    renderTypePaneItem = item => {
      const {selectedType} = this.props.router.state
      const selected = item.name === selectedType
      return (
        <TypePaneItem
          key={item.key}
          selected={selected}
          type={item}
          onClick={this.handleItemClick}
        />
      )
    }

    render() {
      const {items, router} = this.props
      const {selectedType, action, selectedDocumentId} = router.state
      const isSelected = !selectedType && !action && !selectedDocumentId

      return (
        <Pane {...this.props} styles={contentStylesOverride} isSelected={isSelected}>
          <ul className={styles.list}>
            {items.map((item, i) => {
              return (
                <li key={item.key} className={styles.item}>
                  {this.renderTypePaneItem(item)}
                </li>
              )
            })}
          </ul>
        </Pane>
      )
    }
  }
)
