import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../../../FormBuilderPropTypes'
import {bindAll} from 'lodash'
import Preview from '../../../Preview'
import Button from 'part:@sanity/components/buttons/default' //eslint-disable-line
import InInputButton from 'part:@sanity/components/buttons/in-input' //eslint-disable-line
import Dialog from 'part:@sanity/components/dialogs/default' //eslint-disable-line
import styles from './styles/ReferenceBrowser.css'
import DefaultList from 'part:@sanity/components/lists/default' //eslint-disable-line
// import Spinner from 'part:@sanity/components/loading/spinner' //eslint-disable-line

export default class ReferenceBrowser extends React.Component {
  static propTypes = {
    type: FormBuilderPropTypes.type,
    field: FormBuilderPropTypes.field,
    value: PropTypes.object,
    fetchFn: PropTypes.func,
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
      fetching: false,
      dialogSelectedItem: null
    }
    this._isFetching = false
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

  handleClearValue(event) {
    event.preventDefault()
    const {onChange} = this.props
    onChange({patch: {type: 'unset'}})
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

        const updatedCache = items.reduce((cache, item) => {
          cache[item._id] = item
          return cache
        }, Object.assign({}, this.state.refCache))

        this.setState({
          items: items,
          fetching: false,
          refCache: updatedCache
        })
      })
  }
  renderItem = item => {
    const field = this.getItemFieldForType(item._type)
    return (
      <Preview
        field={field}
        value={item}
      />
    )
  }

  renderDialog() {
    const {fetching, items, dialogSelectedItem} = this.state
    const {field, value} = this.props
    const toTypes = field.to.map(toField => toField.type)
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
        title={`Select ${toTypes.join(', ')}`}
        actions={actions}
        onClose={this.handleCloseDialog}
        onAction={this.handleDialogAction}
        isOpen
      >
        <DefaultList
          loading={fetching}
          renderItem={this.renderItem}
          items={items}
          scrollable
          onSelect={this.handleDialogSelectItem}
          selectedItem={dialogSelectedItem || selectedItemFromValue}
        />
      </Dialog>
    )
  }

  renderValue() {
    const {value, field} = this.props

    const renderButtons = () => {
      if (value.isEmpty()) {
        return (
          <div className={styles.buttons}>
            <InInputButton onClick={this.handleShowDialog}>Browse…</InInputButton>
          </div>
        )
      }
      return (
        <div className={styles.buttons}>
          <InInputButton onClick={this.handleClearValue} kind="danger">Clear</InInputButton>
          <InInputButton onClick={this.handleShowDialog}>Change</InInputButton>
        </div>
      )
    }
    return (
      <div>
        <div className={styles.preview}>
          {!value.isEmpty() && (
            <Preview
              field={field}
              value={value.serialize()}
              style="inline"
            />
          )}
        </div>
        {renderButtons()}
      </div>
    )
  }

  render() {
    const {showDialog} = this.state
    return (
      <div className={styles.root}>
        {showDialog ? this.renderDialog() : this.renderValue()}
      </div>
    )
  }
}
