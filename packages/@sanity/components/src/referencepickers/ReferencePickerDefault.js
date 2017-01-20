import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/referencepickers/default-style'

import SearchField from 'part:@sanity/components/textfields/search'
import TextField from 'part:@sanity/components/textfields/default'
import List from 'part:@sanity/components/lists/default'
import GridList from 'part:@sanity/components/lists/grid'
import ToggleButtons from 'part:@sanity/components/toggles/buttons'

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
    onSearch: PropTypes.func,
    filter: PropTypes.bool,
    view: PropTypes.oneOf(['list', 'thumbs', 'detail', 'custom']),
    layout: PropTypes.oneOf(['media', 'block', 'string'])
  }

  constructor(context, props) {
    super(context, props)
    this.handleSearch = this.handleSearch.bind(this)
    this.state = {
      view: this.props.view || 'list'
    }
  }

  changeView(viewName) {
    // console.log('change view', viewName)
    this.setState({
      view: viewName
    })
  }

  handleSearch(value) {
    // Handle search
  }

  render() {

    const {items, className, onSearch, filter} = this.props

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
      <div className={`${styles.root} ${className}`}>
        <div className={styles.inner}>
          <div className={styles.functions}>
            {
              onSearch && <div className={styles.search}>
                <SearchField placeholder="Search…" onKeyPress={this.handleSearch} />
              </div>
            }
            {
              filter && <div className={styles.search}>
                <TextField placeholder="Search…" />
              </div>
            }
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
              && <GridList items={items} scrollable className={styles.list} />
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
