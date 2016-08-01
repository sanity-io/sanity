import React, {PropTypes} from 'react'
import styles from 'style:@sanity/components/referencepickers/default'

import {range} from 'lodash'
import Faker from 'Faker'

import SearchField from 'component:@sanity/components/textfields/search'
import List from 'component:@sanity/components/lists/default'
import ThumbList from 'component:@sanity/components/lists/thumbs'
import ToggleButtons from 'component:@sanity/components/toggles/buttons'

export default class DefaultList extends React.Component {
  static propTypes = {
    items: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string,
        content: PropTypes.node,
        key: PropTypes.string,
        extraContent: PropTypes.node,
        icon: PropTypes.node
      })
    ),
    onSelect: PropTypes.func,
    selectable: PropTypes.bool,
    loading: PropTypes.bool,
    children: PropTypes.node,
    className: PropTypes.string,
    layout: PropTypes.oneOf(['media', 'block', 'string'])
  }

  constructor(context, props) {
    super(context, props)
    this.state = {
      view: 'thumbs'
    }
  }

  changeView(viewName) {
    console.log('change view', viewName)
    this.setState({
      view: viewName
    })
  }

  render() {

    const {items, children, layout, className} = this.props

    const toggleItems = [
      {
        title: 'Thumbs',
        action: () => {
          this.changeView('thumbs')
        }
      },
      {
        title: 'List',
        action: () => {
          this.changeView('list')
        }
      },
      {
        title: 'Details',
        action: () => {
          this.changeView('details')
        }
      }
    ]

    return (
      <div className={styles.root}>
        <div className={styles.inner}>
          <div className={styles.functions}>
            <div className={styles.search}>
              <SearchField placeholder="Search…" />
            </div>
            <div className={styles.toggle}>
              <ToggleButtons items={toggleItems} label="View" />
            </div>
          </div>
          <div className={styles.listContainer}>
            {
              this.state.view == 'list'
              && <List items={items} scrollable className={styles.list} />
            }
            {
              this.state.view == 'thumbs'
              && <ThumbList items={items} scrollable className={styles.list} />
            }
            {
              this.state.view == 'details'
              && <div>Details view do not exist yet</div>
            }
          </div>
        </div>
      </div>
    )
  }
}
