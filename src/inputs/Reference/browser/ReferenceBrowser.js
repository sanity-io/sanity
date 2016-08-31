import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../../../FormBuilderPropTypes'
import {bindAll} from 'lodash'
import ItemPreview from '../common/ItemPreview'
import Button from 'component:@sanity/components/buttons/default' //eslint-disable-line
import Dialog from 'component:@sanity/components/dialogs/default' //eslint-disable-line
import styles from './styles/ReferenceBrowser.css'
import DefaultList from 'component:@sanity/components/lists/default' //eslint-disable-line
import Spinner from 'component:@sanity/components/loading/spinner' //eslint-disable-line

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
            [materializedValue.value.$id]: materializedValue
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
            $set: {
              $type: 'reference',
              $ref: dialogSelectedItem.value.$id
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
    onChange({patch: {$set: undefined}})
  }

  createValueFromItem(item) {
    return this.context.formBuilder.createFieldValue(item, this.getItemFieldForType(item.$type))
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
          cache[item.value.$id] = item
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
    const {field} = this.props
    const toTypes = field.to.map(toField => toField.type)
    const actions = [
      dialogSelectedItem && {index: 'set', title: 'Change'},
      {index: 'cancel', title: 'Cancel'}
    ].filter(Boolean)

    items.map((item, i) => {
      item.key = item.value.$id
      item.title = item.value.name.value
      return true
    })

    const currentItem = items.find(item => {
      return this.props.value.value.$ref == item.key
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
          <div>
            <Spinner />
            Loading…
          </div>
        )
      }

      // Todo: make context.field an official / formalized thing
      const itemField = materializedValue.context.field
      return (
        <div>
          <ItemPreview
            field={itemField}
            value={materializedValue}
          />
        </div>
      )
    }

    const renderButtons = () => {
      if (value.isEmpty()) {
        return <Button className={styles.chooseButton} onClick={this.handleShowDialog}>Browse…</Button>
      }
      return (
        <div>
          <Button className={styles.clearButton} onClick={this.handleClearValue}>Delete</Button>
          <Button className={styles.replaceButton} onClick={this.handleShowDialog}>Change</Button>
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
