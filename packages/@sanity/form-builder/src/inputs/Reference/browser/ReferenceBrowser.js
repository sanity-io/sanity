import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../../../FormBuilderPropTypes'
import Preview from '../../../Preview'
import InInputButton from 'part:@sanity/components/buttons/in-input' //eslint-disable-line
import Dialog from 'part:@sanity/components/dialogs/default' //eslint-disable-line
import styles from './styles/ReferenceBrowser.css'
import DefaultList from 'part:@sanity/components/lists/default' //eslint-disable-line
import subscriptionManager from '../../../utils/subscriptionManager'

export default class ReferenceBrowser extends React.Component {
  static propTypes = {
    type: FormBuilderPropTypes.type,
    value: PropTypes.object,
    searchFn: PropTypes.func,
    fetchValueFn: PropTypes.func,
    onChange: PropTypes.func
  };

  static defaultProps = {
    onChange() {}
  };

  static contextTypes = {
    formBuilder: PropTypes.object
  };

  state = {
    items: [],
    refCache: {},
    showDialog: false,
    isSearching: true,
    dialogSelectedItem: null,
    materializedValue: null
  }

  subscriptions = subscriptionManager('fetchValue', 'search')

  componentWillUnmount() {
    this.subscriptions.unsubscribeAll()
  }

  componentWillMount() {
    this.syncValue(this.props.value)
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.value !== nextProps.value) {
      this.syncValue(nextProps.value)
    }
  }

  getMemberType(typeName) {
    const {type} = this.props
    return type.to.find(ofType => ofType.name === typeName)
  }

  handleDialogSelectItem = item => {
    this.setState({
      dialogSelectedItem: item
    })
  }

  handleCloseDialog = event => {
    this.setState({showDialog: false})
  }

  handleShowDialog = event => {
    this.setState({showDialog: true})
    this.search('*')
  }

  handleDialogAction = action => {
    const {onChange} = this.props
    switch (action.index) {
      case 'set': {
        const {dialogSelectedItem} = this.state
        if (dialogSelectedItem) {
          const patch = {
            type: 'set',
            value: {
              _type: 'reference',
              _ref: dialogSelectedItem._id
            }
          }
          onChange({patch: patch})
        }
        this.setState({dialogSelectedItem: null, showDialog: false})
        break
      }
      case 'cancel': {
        this.setState({showDialog: false})
        break
      }
      default: {
        console.error('Unsupported action: ', action) // eslint-disable-line
      }
    }
  }

  handleClearValue = event => {
    event.preventDefault()
    const {onChange} = this.props
    onChange({patch: {type: 'unset'}})
  }

  syncValue(value) {
    const {fetchValueFn, type} = this.props

    if (value.isEmpty()) {
      this.setState({materializedValue: null})
      return
    }

    const serialized = value.serialize()
    this.subscriptions.replace('fetchValue', fetchValueFn(serialized, type)
      .subscribe(materializedValue => {
        this.setState({materializedValue})
      }))
  }

  search(query) {
    const {searchFn, type} = this.props

    this.setState({isSearching: true})

    this.subscriptions.replace('search', searchFn(query, type)
      .subscribe(items => {
        const updatedCache = items.reduce((cache, item) => {
          cache[item._id] = item
          return cache
        }, Object.assign({}, this.state.refCache))

        this.setState({
          items: items,
          isSearching: false,
          refCache: updatedCache
        })
      })
    )
  }

  renderItem = item => {
    const showItemType = this.props.type.to.length > 1
    const type = this.getMemberType(item._type)
    return (
      <div>
        <Preview
          type={type}
          value={item}
        />
        {showItemType && <span className={styles.typeName}>{item._type}</span>}
      </div>
    )
  }

  renderDialog() {
    const {isSearching, items, dialogSelectedItem} = this.state
    const {type, value} = this.props
    const toTypes = type.to.map(toField => toField.type)
    const actions = [
      dialogSelectedItem && {index: 'set', title: 'Change'},
      {index: 'cancel', title: 'Cancel'}
    ].filter(Boolean)

    const selectedItemFromValue = items.find(item => {
      return item._id == value.refId
    })

    return (
      <Dialog
        className={styles.dialog}
        showHeader
        title={`Select ${toTypes.map(toType => toType.title).join(', ')}`}
        actions={actions}
        onClose={this.handleCloseDialog}
        onAction={this.handleDialogAction}
        isOpen
      >
        <DefaultList
          loading={isSearching}
          renderItem={this.renderItem}
          items={items}
          scrollable
          onSelect={this.handleDialogSelectItem}
          selectedItem={dialogSelectedItem || selectedItemFromValue}
        />
      </Dialog>
    )
  }

  renderValue(materializedValue) {
    const valueType = this.getMemberType(materializedValue._type)
    return (
      <div className={styles.preview}>
        {materializedValue && (
          <Preview
            type={valueType}
            value={materializedValue}
            layout="inline"
          />
        )}
      </div>
    )
  }

  render() {
    const {showDialog, materializedValue} = this.state
    return (
      <div className={styles.root}>
        {showDialog && this.renderDialog()}
        {!materializedValue && (
          <div className={styles.buttons}>
            <InInputButton onClick={this.handleShowDialog}>Browse…</InInputButton>
          </div>
        )}
        {materializedValue && (
          <div>
            {this.renderValue(materializedValue)}
            <div className={styles.buttons}>
              <InInputButton onClick={this.handleClearValue} kind="danger">Clear</InInputButton>
              <InInputButton onClick={this.handleShowDialog}>Change</InInputButton>
            </div>
          </div>
        )}
      </div>
    )
  }
}
