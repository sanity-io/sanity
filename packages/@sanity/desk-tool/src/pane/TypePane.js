import PropTypes from 'prop-types'
import React from 'react'
import styles from './styles/TypePane.css'
import {withRouterHOC} from 'part:@sanity/base/router'
import Pane from 'part:@sanity/components/panes/default'

export default withRouterHOC(class Pane extends React.PureComponent {

  static propTypes = {
    items: PropTypes.array, // eslint-disable-line react/forbid-prop-types
    renderItem: PropTypes.func,
    router: PropTypes.shape({
      state: PropTypes.object
    })
  }

  render() {
    const {items, renderItem, router} = this.props
    const {selectedType, action, selectedDocumentId} = router.state

    // const isActive = !selectedType && !action && !selectedDocumentId

    return (
      <Pane title="Content">
        <ul className={styles.listContainer}>
          {
            items.map((item, i) => {
              return (
                <li key={i} className={styles.item}>
                  {renderItem(item)}
                </li>
              )
            })
          }
        </ul>
      </Pane>
    )
  }
})
