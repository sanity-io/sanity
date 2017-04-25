import cls from 'classnames'
import PropTypes from 'prop-types'
import React from 'react'
import Spinner from 'part:@sanity/components/loading/spinner'
import GridList from 'part:@sanity/components/lists/grid'
import styles from './styles/Pane.css'
import PaneMenuContainer from './PaneMenuContainer'
import {find} from 'lodash'
import {StateLink, withRouterHOC} from 'part:@sanity/base/router'
import Infinite from 'react-infinite'
import elementResizeDetectorMaker from 'element-resize-detector'

export default withRouterHOC(class Pane extends React.PureComponent {

  static propTypes = {
    loading: PropTypes.bool,
    items: PropTypes.array, // eslint-disable-line react/forbid-prop-types
    renderItem: PropTypes.func,
    getItemKey: PropTypes.func,
    onSetListLayout: PropTypes.func,
    onSetSorting: PropTypes.func,
    listLayout: PropTypes.oneOf(['default', 'media', 'cards', 'media']),
    type: PropTypes.shape({
      title: PropTypes.string
    }),
    onSelect: PropTypes.func,
    router: PropTypes.shape({
      state: PropTypes.shape({
        selectType: PropTypes.string
      })
    })
  }

  static defaultProps = {
    listLayout: 'default',
    loading: false,
    items: [],
    type: {},
    router: {},
    onSetSorting() {
      return false
    },
    onSetListLayout() {
      return false
    },
    getItemKey() {
      return false
    },
    renderItem() {
      return <div>Empty</div>
    },
    onSelect() {
      return false
    }
  }

  state = {
    isInfiniteLoading: false
  }

  handleSelect = item => {
    this.props.onSelect(item)
    return false
  }

  componentWillMount() {
    this.erd = elementResizeDetectorMaker({strategy: 'scroll'})
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.items !== nextProps.items) {

      const elements = nextProps.items.map((item, i) => {
        return this.createListElement(item, i)
      })

      this.setState({
        elements: elements
      })
    }
  }

  componentWillUnmount() {
    this.erd.removeAllListeners(this._rootElement)
    this.erd.uninstall(this._rootElement)
  }

  createListElement = (item, i) => {
    return (
      <div className="infinite-list-item" key={item._id}>
        {this.props.renderItem(item, i, {})}
      </div>
    )
  }

  handleInfiniteLoad = () => {
    return false
  }

  setRootElement = element => {
    const {height} = this.state
    this._rootElement = element
    this.erd.listenTo(this._rootElement, el => {
      const newHeight = this._rootElement.offsetHeight
      if (height !== newHeight) {
        this.setState({
          height: newHeight
        })
      }
    })
  }

  render() {
    const {
      loading,
      listLayout,
      items,
      type,
      router,
      onSetListLayout,
      onSetSorting,
      renderItem,
      getItemKey
    } = this.props

    const {selectedType, action, selectedDocumentId} = router.state

    const selectedItem = find(items, item => item._id == selectedDocumentId)
    const isActive = selectedType && !action && !selectedDocumentId
    const paneClasses = cls([
      isActive ? styles.isActive : styles.isInactive,
      styles[`list-layout--${listLayout}`]
    ])

    return (

      <div className={paneClasses} ref={this.setRootElement}>
        <div className={styles.top}>
          <div className={styles.heading}>
            {type.title}
          </div>
          <PaneMenuContainer
            onSetListLayout={onSetListLayout}
            onSetSorting={onSetSorting}
          />
        </div>

        {loading && (
          <div className={styles.spinner}>
            <Spinner center message="Loading items…" />
          </div>
          )
        }

        {
          items && !loading && items.length == 0 && (
            <div className={styles.empty}>
              <h3>Nothing here. Yet…</h3>
              <StateLink
                className={styles.emptyCreateNew}
                title={`Create new ${type.title}`}
                state={{selectedType: type.name, action: 'create'}}
              >
                  Create new {type.title}
              </StateLink>
            </div>
          )
        }

        {
          listLayout == 'card' && items && items.length > 0 && (
            <div className={styles.listContainer}>
              <GridList
                overrideItemRender
                items={items}
                getItemKey={getItemKey}
                layout="masonry"
                renderItem={renderItem}
                selectedItem={selectedItem}
                onSelect={this.handleSelect}
              />
            </div>
          )
        }

        {
          (listLayout === 'media' && items && items.length > 0) && (
            <div className={styles.listContainer}>
              <GridList
                overrideItemRender
                items={items}
                getItemKey={getItemKey}
                renderItem={renderItem}
                selectedItem={selectedItem}
                onSelect={this.handleSelect}
              />
            </div>
          )
        }
        {
          (listLayout === 'default' || listLayout === 'detail')
            && <Infinite
              className={styles.listContainer}
              elementHeight={listLayout === 'default' ? 40 : 80}
              containerHeight={this.state.height || 250}
              infiniteLoadBeginEdgeOffset={200}
              onInfiniteLoad={this.handleInfiniteLoad}
              isInfiniteLoading={this.state.isInfiniteLoading}
               >
              {this.state.elements}
            </Infinite>
        }
      </div>
    )
  }
})
