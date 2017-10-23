// @flow
import React from 'react'
import SearchableSelect from 'part:@sanity/components/selects/searchable'
import FormField from 'part:@sanity/components/formfields/default'
import Preview from '../../Preview'
import subscriptionManager from '../../utils/subscriptionManager'
import PatchEvent, {set, setIfMissing, unset} from '../../../PatchEvent'
import type {Reference, Type} from '../../typedefs'
import type {ObservableI} from '../../typedefs/observable'
import LinkIcon from 'part:@sanity/base/link-icon'
import {IntentLink} from 'part:@sanity/base/router'

type SearchHit = {
  _id: string,
  _type: string
}

type Props = {
  value: ?Reference,
  type: Type,
  onSearch: (query: string, type: Type) => ObservableI<Array<SearchHit>>,
  valueToString: Reference => any,
  onChange: PatchEvent => void,
  level: number
}

type State = {
  isFetching: boolean,
  hits: Array<SearchHit>,
  valueAsString: ?string,
  refCache: {[string]: SearchHit}
}

const getInitialState = (): State => {
  return {
    isFetching: false,
    hits: [],
    valueAsString: null,
    refCache: {}
  }
}

export default class ReferenceInput extends React.Component<Props, State> {
  _lastQuery: string

  state = getInitialState()
  subscriptions = subscriptionManager('search', 'valueToString')
  _lastQuery = ''

  componentWillUnmount() {
    this.subscriptions.unsubscribeAll()
  }

  componentDidMount() {
    this.fetchValueAsString(this.props.value)
  }

  componentWillReceiveProps(nextProps: Props) {
    if (nextProps.value !== this.props.value) {
      this.setState(getInitialState())
      this.fetchValueAsString(nextProps.value)
    }
  }

  fetchValueAsString(value: Reference) {
    if (!value || !value._ref) {
      return
    }
    const {valueToString, type} = this.props

    this.subscriptions.replace('valueToString', valueToString(value, type)
      .subscribe(valueAsString => {
        this.setState({valueAsString})
      }))
  }

  getMemberTypeFor(typeName: string) {
    const {type} = this.props
    return type.to.find(ofType => ofType.type.name === typeName)
  }

  handleFocus = () => {
    if (this._lastQuery) {
      this.search(this._lastQuery)
    }
  }

  handleChange = (item: SearchHit) => {
    this.props.onChange(PatchEvent.from(
      setIfMissing({
        _type: 'reference',
        _ref: item._id
      }),
      set(item._id, ['_ref'])
    ))
  }

  handleSearch = (query: string) => {
    this.search(query)
  }

  handleOpen = () => {
    this.search('*')
  }

  search = (query: string) => {
    const {type, onSearch} = this.props

    this.setState({
      isFetching: true
    })

    this.subscriptions.replace('search', onSearch(query, type)
      .subscribe((items: Array<SearchHit>) => {
        const updatedCache = items.reduce((cache, item) => {
          cache[item._id] = item
          return cache
        }, Object.assign({}, this.state.refCache))

        this.setState({
          hits: items,
          isFetching: false,
          refCache: updatedCache
        })
      }))
  }

  renderHit = (item: SearchHit) => {
    const type = this.getMemberTypeFor(item._type)
    return (
      <Preview
        type={type}
        value={item}
        layout="default"
      />
    )
  }

  handleClear = () => {
    this.props.onChange(PatchEvent.from(unset()))
  }

  createOpenItemElement = value => {
    console.log('value', value)
    return (
      <IntentLink
        title={`Open ${value.title}`}
        intent="edit"
        params={{id: value._ref}}
      >
        <LinkIcon />
      </IntentLink>
    )
  }

  render() {
    const {
      type,
      value,
      level,
      onSearch,
      valueToString,
      ...rest
    } = this.props

    const {valueAsString, isFetching, hits} = this.state

    const valueFromHit = value && hits.find(hit => hit._id === value._ref)

    return (
      <FormField label={type.title} level={level} description={type.description}>
        test
        <SearchableSelect
          {...rest}
          placeholder="Type to search…"
          onOpen={this.handleOpen}
          onFocus={this.handleFocus}
          onSearch={this.handleSearch}
          onChange={this.handleChange}
          onClear={this.handleClear}
          openItemElement={this.createOpenItemElement}
          value={valueFromHit || value}
          inputValue={valueAsString}
          renderItem={this.renderHit}
          isLoading={isFetching}
          items={hits}
        />
      </FormField>
    )
  }
}
