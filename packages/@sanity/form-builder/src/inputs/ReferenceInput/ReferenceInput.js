// @flow
/* eslint-disable complexity */
import React from 'react'
import SearchableSelect from 'part:@sanity/components/selects/searchable'
import FormField from 'part:@sanity/components/formfields/default'
import Preview from '../../Preview'
import subscriptionManager from '../../utils/subscriptionManager'
import PatchEvent, {set, setIfMissing, unset} from '../../../PatchEvent'
import type {Reference, Type, Marker} from '../../typedefs'
import type {ObservableI} from '../../typedefs/observable'
import LinkIcon from 'part:@sanity/base/link-icon'
import {IntentLink} from 'part:@sanity/base/router'
import styles from './styles/ReferenceInput.css'
import Button from 'part:@sanity/components/buttons/default'

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
  markers: Array<Marker>,
  readOnly: ?boolean,
  onSearch: (query: string, type: Type) => ObservableI<Array<SearchHit>>,
  getPreviewSnapshot: (Reference, Type) => ObservableI<PreviewSnapshot>,
  onChange: PatchEvent => void,
  level: number
}

type State = {
  isFetching: boolean,
  hits: Array<SearchHit>,
  previewSnapshot: ?PreviewSnapshot,
  refCache: {[string]: SearchHit}
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
  _input: SearchableSelect

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

    this.subscriptions.replace(
      'previewSnapshot',
      getPreviewSnapshot(value, type).subscribe(snapshot => {
        this.setState({previewSnapshot: snapshot || MISSING_SNAPSHOT})
      })
    )
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
    this.props.onChange(
      PatchEvent.from(
        setIfMissing({
          _type: type.name,
          _ref: item._id
        }),
        type.weak === true ? set(true, ['_weak']) : unset(['_weak']),
        set(item._id, ['_ref'])
      )
    )
  }

  handleFixWeak = () => {
    const {type} = this.props
    this.props.onChange(
      PatchEvent.from(type.weak === true ? set(true, ['_weak']) : unset(['_weak']))
    )
  }

  handleClear = () => {
    this.props.onChange(PatchEvent.from(unset()))
  }

  handleSearch = (query: string) => {
    this.search(query)
  }

  handleOpen = () => {
    this.search('')
  }

  search = (query: string) => {
    const {type, onSearch} = this.props

    this.setState({
      isFetching: true
    })

    this.subscriptions.replace(
      'search',
      onSearch(query, type).subscribe((items: Array<SearchHit>) => {
        const updatedCache = items.reduce((cache, item) => {
          cache[item._id] = item
          return cache
        }, Object.assign({}, this.state.refCache))

        this.setState({
          hits: items,
          isFetching: false,
          refCache: updatedCache
        })
      })
    )
  }

  renderHit = (item: SearchHit) => {
    const type = this.getMemberTypeFor(item._type)
    return <Preview type={type} value={item} layout="default" />
  }

  renderOpenItemElement = () => {
    const {value} = this.props
    const {previewSnapshot} = this.state
    if (!value || !value._ref || previewSnapshot === MISSING_SNAPSHOT) {
      return null
    }
    return (
      <IntentLink
        title={previewSnapshot && `Open ${previewSnapshot.title}`}
        intent="edit"
        params={{id: value._ref}}
      >
        <LinkIcon />
      </IntentLink>
    )
  }

  focus() {
    if (this._input) {
      this._input.focus()
    }
  }

  setInput = (input: ?SearchableSelect) => {
    this._input = input
  }

  render() {
    const {type, value, level, markers, readOnly} = this.props

    const {previewSnapshot, isFetching, hits} = this.state
    const valueFromHit = value && hits.find(hit => hit._id === value._ref)

    const weakIs = value && value._weak ? 'weak' : 'strong'
    const weakShouldBe = type.weak === true ? 'weak' : 'strong'

    const isMissing = previewSnapshot === MISSING_SNAPSHOT
    const hasRef = value && value._ref
    const hasWeakMismatch = hasRef && !isMissing && weakIs !== weakShouldBe

    const validation = markers.filter(marker => marker.type === 'validation')
    const errors = validation.filter(marker => marker.level === 'error')

    let inputValue = value ? previewSnapshot && previewSnapshot.title : undefined

    if (previewSnapshot && !previewSnapshot.title) {
      inputValue = 'Untitled document'
    }

    const isLoadingSnapshot = value && value._ref && !previewSnapshot
    const placeholder = isLoadingSnapshot ? 'Loading…' : 'Type to search…'

    return (
      <FormField markers={markers} label={type.title} level={level} description={type.description}>
        <div className={hasWeakMismatch || isMissing ? styles.hasWarnings : ''}>
          {hasWeakMismatch && (
            <div className={styles.weakRefMismatchWarning}>
              Warning: This reference is <em>{weakIs}</em>, but should be <em>{weakShouldBe}</em>{' '}
              according to schema.
              <div>
                <Button onClick={this.handleFixWeak}>Convert to {weakShouldBe}</Button>
              </div>
            </div>
          )}
          <SearchableSelect
            placeholder={readOnly ? '' : placeholder}
            title={
              isMissing && hasRef
                ? `Document id: ${value._ref || 'unknown'}`
                : previewSnapshot && previewSnapshot.description
            }
            customValidity={errors.length > 0 ? errors[0].item.message : ''}
            onOpen={this.handleOpen}
            onFocus={this.handleFocus}
            onSearch={this.handleSearch}
            onChange={this.handleChange}
            onClear={this.handleClear}
            openItemElement={this.renderOpenItemElement}
            value={valueFromHit || value}
            inputValue={isMissing ? '<Unpublished or missing document>' : inputValue}
            renderItem={this.renderHit}
            isLoading={isFetching || isLoadingSnapshot}
            items={hits}
            ref={this.setInput}
            readOnly={readOnly || isLoadingSnapshot}
          />
        </div>
      </FormField>
    )
  }
}
