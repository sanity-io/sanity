import PropTypes from 'prop-types'
import React from 'react'
import styles from './styles/TypePane.css'
import {withRouterHOC} from 'part:@sanity/base/router'
import Pane from 'part:@sanity/components/panes/default'
import TypePaneItem from './TypePaneItem'

export default withRouterHOC(class TypePane extends React.PureComponent {

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
    const {items} = this.props
    // const {selectedType, action, selectedDocumentId} = router.state
    // const isActive = !selectedType && !action && !selectedDocumentId

    return (
      <Pane {...this.props}>
        <ul className={styles.list}>
          {
            items.map((item, i) => {
              return (
                <li key={item.key} className={styles.item}>
                  {
                    this.renderTypePaneItem(item)
                  }
                </li>
              )
            })
          }
        </ul>
      </Pane>
    )
  }
})
