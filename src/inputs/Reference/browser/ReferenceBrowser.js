import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../../../FormBuilderPropTypes'
import {bindAll} from 'lodash'
import ItemPreview from '../common/ItemPreview'
import Button from 'part:@sanity/components/buttons/default' //eslint-disable-line
import InInputButton from 'part:@sanity/components/buttons/in-input' //eslint-disable-line
import Dialog from 'part:@sanity/components/dialogs/default' //eslint-disable-line
import styles from './styles/ReferenceBrowser.css'
import DefaultList from 'part:@sanity/components/lists/default' //eslint-disable-line
import Spinner from 'part:@sanity/components/loading/spinner' //eslint-disable-line

export default class ReferenceBrowser extends React.Component {
  static propTypes = {
    type: FormBuilderPropTypes.type,
    field: FormBuilderPropTypes.field,
    value: PropTypes.object,
    fetchFn: PropTypes.func,
    materializeReferences: PropTypes.func,
    onChange: PropTypes.func
  };

  static defaultProps = {
    onChange() {}
  };

  static contextTypes = {
    formBuilder: PropTypes.object
  };

  constructor(props, ...rest) {
    super(props, ...rest)
    bindAll(this, [
      'handleDialogSelectItem',
      'handleClearValue',
      'handleShowDialog',
      'handleCloseDialog',
      'handleDialogAction'
    ])

    this.state = {
      items: [],
      refCache: {},
      showDialog: false,
      materializedValue: null,
      fetching: false,
      dialogSelectedItem: null
    }
    this._isFetching = false
  }

  componentWillMount() {
    this.loadValue(this.props.value)
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.value !== this.props.value) {
      this.loadValue(nextProps.value)
    }
  }

  getItemFieldForType(typeName) {
    const {type} = this.props
    return type.to.find(ofType => {
      return ofType.type === typeName
    })
  }

  handleDialogSelectItem(item) {
    this.setState({
      dialogSelectedItem: item
    })
  }

  loadValue(value) {
    const {materializeReferences} = this.props

    if (value.isEmpty()) {
      return
    }

    materializeReferences([value.refId])
      .then(materializedRefs => {
        return this.createValueFromItem(materializedRefs[0])
      })
      .then(materializedValue => {
        const {refCache} = this.state
        this.setState({
          refCache: Object.assign({}, refCache, {
            [materializedValue.value._id]: materializedValue
          })
        })
      })

  }

  handleCloseDialog(event) {
    this.setState({showDialog: false})
  }

  handleShowDialog(event) {
    this.setState({showDialog: true})
    this.fetch()
  }

  handleDialogAction(action) {
    const {onChange} = this.props
    switch (action.index) {
      case 'set': {
        const {dialogSelectedItem} = this.state
        if (dialogSelectedItem) {
          const patch = {
            type: 'set',
            value: {
              _type: 'reference',
              _ref: dialogSelectedItem.value._id
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

  handleClearValue(event) {
    event.preventDefault()
    const {onChange} = this.props
    onChange({patch: {type: 'set', value: undefined}})
  }

  createValueFromItem(item) {
    return this.context.formBuilder.createFieldValue(item, this.getItemFieldForType(item._type))
  }

  fetch() {
    const {fetchFn, field} = this.props
    if (this._isFetching === true) {
      return
    }

    this._isFetching = true

    this.setState({fetching: true})

    fetchFn(field)
      .then(items => {
        this._isFetching = false
        const preparedItems = items.map(item => this.createValueFromItem(item))

        const updatedCache = preparedItems.reduce((cache, item) => {
          cache[item.value._id] = item
          return cache
        }, Object.assign({}, this.state.refCache))

        this.setState({
          items: preparedItems,
          fetching: false,
          refCache: updatedCache
        })
      })
  }

  renderDialog() {
    const {fetching, items, dialogSelectedItem} = this.state
    const {field, value} = this.props
    const toTypes = field.to.map(toField => toField.type)
    const actions = [
      dialogSelectedItem && {index: 'set', title: 'Change'},
      {index: 'cancel', title: 'Cancel'}
    ].filter(Boolean)

    items.map((item, i) => {
      item.key = item.value._id
      item.title = item.value.name.value
      return true
    })

    const currentItem = items.find(item => {
      return value.refId == item.key
    })

    return (
      <Dialog
        className={styles.dialog}
        showHeader
        title={`Select ${toTypes.join(', ')}`}
        actions={actions}
        onClose={this.handleCloseDialog}
        onAction={this.handleDialogAction}
        isOpen
      >
        <DefaultList
          className={styles.list}
          loading={fetching}
          items={items}
          scrollable
          onSelect={this.handleDialogSelectItem}
          selectedItem={dialogSelectedItem || currentItem}
        />
      </Dialog>
    )
  }

  renderValue() {
    const {value} = this.props
    const {refCache} = this.state

    const renderPreview = () => {
      if (value.isEmpty()) {
        return <span>No value</span>
      }

      const materializedValue = refCache[value.refId]
      if (!materializedValue) {
        return (
          <div className={styles.preview}>
            <Spinner />
            Loading…
          </div>
        )
      }

      // Todo: make context.field an official / formalized thing
      const itemField = materializedValue.context.field
      return (
        <div className={styles.preview}>
          <ItemPreview
            field={itemField}
            value={materializedValue}
          />
        </div>
      )
    }

    const renderButtons = () => {
      if (value.isEmpty()) {
        return <div className={styles.buttons}>
          <InInputButton onClick={this.handleShowDialog}>Browse…</InInputButton>
        </div>
      }
      return (
        <div className={styles.buttons}>
          <InInputButton onClick={this.handleClearValue} kind="danger">Delete</InInputButton>
          <InInputButton onClick={this.handleShowDialog}>Change</InInputButton>
        </div>
      )
    }
    return (
      <div>
        {renderPreview()}
        {renderButtons()}
      </div>
    )
  }

  render() {
    const {showDialog} = this.state
    return (
      <div className={styles.root}>
        {showDialog && <div>Loading dialog…</div>}
        {showDialog ? this.renderDialog() : this.renderValue()}
      </div>
    )
  }
}
