import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../../../FormBuilderPropTypes'
import {bindAll} from 'lodash'
import ItemPreview from '../common/ItemPreview'
import Button from 'component:@sanity/components/buttons/default'
import Dialog from 'component:@sanity/components/dialogs/default'
import styles from './styles/ReferenceBrowser.css'

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

  handleDialogSelectItem(event) {
    const {refCache} = this.state

    const refId = event.currentTarget.getAttribute('data-id')
    this.setState({
      dialogSelectedItem: refCache[refId]
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
    switch(action.id) {
      case 'set':
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
      case 'cancel':
        this.setState({showDialog: false})
        break
      default:
        console.log('Unsupported action: ', action)
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

  renderItem(item) {
    const itemField = this.getItemFieldForType(item.value.$type)
    return (
      <div onMouseDown={this.handleDialogSelectItem} data-id={item.value.$id}>
        <ItemPreview value={item} field={itemField} />
      </div>
    )
  }

  renderItems(items) {
    const {value} = this.props
    const {dialogSelectedItem} = this.state

    const getItemClass = item => {
      const isCurrent = item.value.$id === value.refId
      const isSelected = item === dialogSelectedItem
      if (isCurrent && isSelected) {
        return styles.itemSelected
      }
      if (isCurrent) {
        return styles.itemCurrent
      }
      if (isSelected) {
        return styles.itemSelected
      }
      return styles.item
    }

    return (
      <ul className={styles.items}>
        {items.map((item, i) => {
          return (
            <li key={item.key || i} className={getItemClass(item)}>{this.renderItem(item, i)}</li>
          )
        })}
      </ul>
    )
  }

  renderDialog() {
    const {fetching, items, dialogSelectedItem} = this.state
    const {field} = this.props
    const toTypes = field.to.map(toField => toField.type)
    const actions = [
      dialogSelectedItem && {id: 'set', title: 'Change'},
      {id: 'cancel', title: 'Cancel'}
    ].filter(Boolean)
    return (
      <Dialog
        className={styles.dialog}
        title={`Select ${toTypes.join(', ')}`}
        actions={actions}
        onClose={this.handleCloseDialog}
        onAction={this.handleDialogAction}
        isOpen
      >
        {fetching && 'Loading items…'}
        {this.renderItems(items)}
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
        return <div>Loading…</div>
      }

      // Todo: make context.field an official / formalized thing
      const itemField = materializedValue.context.field
      return (
        <ItemPreview
          field={itemField}
          value={materializedValue}
        />
      )
    }

    const renderButtons = () => {
      if (value.isEmpty()) {
        return <Button className={styles.chooseButton} onClick={this.handleShowDialog}>Browse…</Button>
      }
      return (
        <span>
          <Button className={styles.clearButton} onClick={this.handleClearValue}>x</Button>,
          <Button className={styles.replaceButton} onClick={this.handleShowDialog}>Replace…</Button>,
        </span>
      )
    }
    return (
      <div className={styles.input}>
        <div
          tabIndex="0"
          onClick={this.handleShowDialog}
        >
          {renderPreview()}
        </div>
        {renderButtons}
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
