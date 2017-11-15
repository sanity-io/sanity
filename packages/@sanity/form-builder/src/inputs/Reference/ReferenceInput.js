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
import styles from './styles/ReferenceInput.css'

type SearchHit = {
  _id: string,
  _type: string
}

type PreviewSnapshot = {
  title: string,
  description: string
}

type Props = {
  value: ?Reference,
  type: Type,
  onSearch: (query: string, type: Type) => ObservableI<Array<SearchHit>>,
  getPreviewSnapshot: (Reference, Type) => ObservableI<PreviewSnapshot>,
  onChange: PatchEvent => void,
  level: number
}

type State = {
  isFetching: boolean,
  hits: Array<SearchHit>,
  previewSnapshot: ?PreviewSnapshot,
  refCache: { [string]: SearchHit }
}

const MISSING_SNAPSHOT = {}

const getInitialState = (): State => {
  return {
    isFetching: false,
    hits: [],
    previewSnapshot: null,
    refCache: {}
  }
}

export default class ReferenceInput extends React.Component<Props, State> {
  _lastQuery: string

  state = getInitialState()
  subscriptions = subscriptionManager('search', 'previewSnapshot')
  _lastQuery = ''

  componentWillUnmount() {
    this.subscriptions.unsubscribeAll()
  }

  componentDidMount() {
    this.getPreviewSnapshot(this.props.value)
  }

  componentWillReceiveProps(nextProps: Props) {
    if (nextProps.value !== this.props.value) {
      this.setState(getInitialState())
      this.getPreviewSnapshot(nextProps.value)
    }
  }

  getPreviewSnapshot(value: Reference) {
    if (!value || !value._ref) {
      return
    }
    const {getPreviewSnapshot, type} = this.props

    this.subscriptions.replace('previewSnapshot', getPreviewSnapshot(value, type)
      .subscribe(snapshot => {
        this.setState({previewSnapshot: snapshot || MISSING_SNAPSHOT})
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
    const {type} = this.props
    this.props.onChange(PatchEvent.from(
      setIfMissing({
        _type: type.name,
        _ref: item._id,
      }),
      type.weak === true ? set(true, ['_weak']) : unset(['_weak']),
      set(item._id, ['_ref'])
    ))
  }

  handleClear = () => {
    this.props.onChange(PatchEvent.from(unset()))
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

  renderOpenItemElement = () => {
    const {value} = this.props
    const {previewSnapshot} = this.state
    return (value && previewSnapshot !== MISSING_SNAPSHOT) && (
      <IntentLink
        title={previewSnapshot && `Open ${previewSnapshot.title}`}
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
      getPreviewSnapshot,
      ...rest
    } = this.props

    const {previewSnapshot, isFetching, hits} = this.state

    const valueFromHit = value && hits.find(hit => hit._id === value._ref)

    const isMissing = value && previewSnapshot === MISSING_SNAPSHOT
    return (
      <FormField label={type.title} level={level} description={type.description}>
        <div className={isMissing ? styles.brokenReferenceWarning : ''}>
          <SearchableSelect
            {...rest}
            placeholder="Type to search…"
            title={(isMissing && value) ? `Document id: ${value._ref}` : (previewSnapshot && previewSnapshot.description)}
            onOpen={this.handleOpen}
            onFocus={this.handleFocus}
            onSearch={this.handleSearch}
            onChange={this.handleChange}
            onClear={this.handleClear}
            openItemElement={this.renderOpenItemElement}
            value={valueFromHit || value}
            inputValue={isMissing ? '<Unpublished or missing document>' : (previewSnapshot && previewSnapshot.title)}
            renderItem={this.renderHit}
            isLoading={isFetching}
            items={hits}
          />
        </div>
      </FormField>
    )
  }
}
