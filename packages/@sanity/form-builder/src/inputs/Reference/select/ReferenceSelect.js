import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../../../FormBuilderPropTypes'
import Select from 'part:@sanity/components/selects/default'

export default class ReferenceSelect extends React.Component {

  static propTypes = {
    type: FormBuilderPropTypes.type,
    type: FormBuilderPropTypes.type,
    value: PropTypes.object,
    fetchAllFn: PropTypes.func,
    materializeReferences: PropTypes.func,
    onChange: PropTypes.func
  }

  static defaultProps = {
    onChange() {}
  }

  static contextTypes = {
    formBuilder: PropTypes.object
  }

  constructor(props, ...rest) {
    super(props, ...rest)

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

  getItemFieldForType = typeName => {
    const {type} = this.props
    return type.to.find(ofType => {
      return ofType.type === typeName
    })
  }

  createValueFromItem = item => {
    return this.context.formBuilder.createFieldValue(item, this.getItemFieldForType(item._type))
  }

  fetch = () => {
    const {fetchAllFn, type} = this.props
    if (this._isFetching === true) {
      return
    }

    this._isFetching = true

    this.setState({fetching: true})

    fetchAllFn(type)
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

  handleFocus = () => {
  }

  componentDidMount() {
    this.fetch()
  }

  handleChange = item => {
    const patch = {
      type: 'set',
      value: {
        _type: 'reference',
        _ref: item.key
      }
    }
    this.props.onChange({patch: patch})
  }

  render() {
    const {value, type} = this.props
    const {items} = this.state

    const selectItems = items.map((item, i) => {
      return {
        key: item.value._id,
        title: item.value.name.value
      }
    })

    const selectedItem = selectItems.find(item => item.key === value.refId)

    return (
      <Select
        label={type.title}
        description={type.description}
        onChange={this.handleChange}
        onFocus={this.handleFocus}
        items={selectItems}
        value={selectedItem}
      />
    )
  }
}
