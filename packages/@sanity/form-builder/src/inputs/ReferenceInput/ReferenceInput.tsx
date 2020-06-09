/* eslint-disable complexity */
import React from 'react'
import {get} from '@sanity/util/paths'
import SearchableSelect from 'part:@sanity/components/selects/searchable'
import FormField from 'part:@sanity/components/formfields/default'
import Preview from '../../Preview'
import subscriptionManager from '../../utils/subscriptionManager'
import PatchEvent, {set, setIfMissing, unset} from '../../../PatchEvent'
import {Reference, Type, Marker} from '../../typedefs'
import {Path} from '../../typedefs/path'
import {ObservableI} from '../../typedefs/observable'
import LinkIcon from 'part:@sanity/base/link-icon'
import {IntentLink} from 'part:@sanity/base/router'
import styles from './styles/ReferenceInput.css'
import Button from 'part:@sanity/components/buttons/default'
import withDocument from '../../utils/withDocument'
import withValuePath from '../../utils/withValuePath'
import {FOCUS_TERMINATOR} from '@sanity/util/paths'
import {uniqueId} from 'lodash'

type SanityDocument = {
  _id: string
  _type: string
  [key: string]: any
}
type SearchHit = {
  _id: string
  _type: string
}
type PreviewSnapshot = {
  title: string
  description: string
}
type SearchOptions = {
  filter?: string
  params?: {[key: string]: any}
}
type FilterResolver = (options: {
  document: SanityDocument
  parent?: object | object[]
  parentPath: Path
}) => SearchOptions
type SearchTypeOptions = {
  // Mutually exclusive if `filter` is a resolver (enforced in schema validation)
  filter?: string | FilterResolver
  filterParams?: {[key: string]: any}
}
type SearchError = {
  message: string
  details?: {
    type: string
    description: string
  }
}
export type Props = {
  value?: Reference
  type: Type & {options?: SearchTypeOptions}
  markers: Array<Marker>
  readOnly?: boolean
  onSearch: (query: string, type: Type, options: SearchOptions) => ObservableI<Array<SearchHit>>
  onFocus: (path: any[]) => void
  getPreviewSnapshot: (Reference, Type) => ObservableI<PreviewSnapshot>
  onChange: (event: PatchEvent) => void
  level: number
  presence: any

  // From withDocument
  document: SanityDocument

  // From withValuePath
  getValuePath: () => Path
}

type State = {
  isFetching: boolean
  hits: Array<SearchHit>
  isMissing: boolean
  previewSnapshot: PreviewSnapshot | null
  refCache: {
    [key: string]: SearchHit
  }
}
const getInitialState = (): State => {
  return {
    isFetching: false,
    hits: [],
    previewSnapshot: null,
    isMissing: false,
    refCache: {}
  }
}

export default withValuePath(
  withDocument(
    class ReferenceInput extends React.Component<Props, State> {
      _lastQuery = ''
      _input: SearchableSelect
      state = getInitialState()
      subscriptions = subscriptionManager('search', 'previewSnapshot')
      _inputId = uniqueId('ReferenceInput')
      componentWillUnmount() {
        this.subscriptions.unsubscribeAll()
      }
      componentDidMount() {
        this.getPreviewSnapshot(this.props.value)
      }
      UNSAFE_componentWillReceiveProps(nextProps: Props) {
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
            this.setState({previewSnapshot: snapshot, isMissing: !snapshot})
          })
        )
      }
      getMemberTypeFor(typeName: string) {
        const {type} = this.props
        return type.to.find(ofType => ofType.type.name === typeName)
      }
      handleFocus = () => {
        const {onFocus} = this.props
        if (this._lastQuery) {
          this.search(this._lastQuery)
        }
        if (onFocus) {
          onFocus([FOCUS_TERMINATOR])
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
      resolveUserDefinedFilter = (): SearchOptions => {
        const {type, document, getValuePath} = this.props
        const options = type.options
        if (!options) {
          return {}
        }

        const {filter, filterParams: params} = options
        if (typeof filter === 'function') {
          const parentPath = getValuePath().slice(0, -1)
          const parent = get(document, parentPath)
          return filter({document, parentPath, parent})
        }

        return {filter, params}
      }
      search = (query: string) => {
        const {type, onSearch} = this.props
        const options = this.resolveUserDefinedFilter()

        this.setState({
          isFetching: true
        })
        this.subscriptions.replace(
          'search',
          onSearch(query, type, options).subscribe({
            next: (items: Array<SearchHit>) => {
              const updatedCache = items.reduce((cache, item) => {
                cache[item._id] = item
                return cache
              }, Object.assign({}, this.state.refCache))
              this.setState({
                hits: items,
                isFetching: false,
                refCache: updatedCache
              })
            },
            error: (err: SearchError) => {
              const isQueryError = err.details && err.details.type === 'queryParseError'
              if (!isQueryError || !this.resolveUserDefinedFilter().filter) {
                throw err
              }

              err.message = 'Invalid reference filter, please check `filter`!'
              throw err
            }
          })
        )
      }
      renderHit = (item: SearchHit) => {
        const type = this.getMemberTypeFor(item._type)
        return <Preview type={type} value={item} layout="default" />
      }
      renderOpenItemElement = () => {
        const {value} = this.props
        const {isMissing, previewSnapshot} = this.state
        if (!value || !value._ref || isMissing) {
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
      setInput = (input?: SearchableSelect) => {
        this._input = input
      }
      render() {
        const {type, value, level, markers, readOnly, presence} = this.props
        const {previewSnapshot, isFetching, isMissing, hits} = this.state
        const valueFromHit = value && hits.find(hit => hit._id === value._ref)
        const weakIs = value && value._weak ? 'weak' : 'strong'
        const weakShouldBe = type.weak === true ? 'weak' : 'strong'

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
          <FormField
            labelFor={this._inputId}
            markers={markers}
            label={type.title}
            level={level}
            description={type.description}
            presence={presence}
          >
            <div className={hasWeakMismatch || isMissing ? styles.hasWarnings : ''}>
              {hasWeakMismatch && (
                <div className={styles.weakRefMismatchWarning}>
                  Warning: This reference is <em>{weakIs}</em>, but should be{' '}
                  <em>{weakShouldBe}</em> according to schema.
                  <div>
                    <Button onClick={this.handleFixWeak}>Convert to {weakShouldBe}</Button>
                  </div>
                </div>
              )}
              <SearchableSelect
                inputId={this._inputId}
                placeholder={readOnly ? '' : placeholder}
                title={
                  isMissing && hasRef
                    ? `Referencing nonexistent document (id: ${value._ref || 'unknown'})`
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
                inputValue={isMissing ? '<nonexistent reference>' : inputValue}
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
  )
)
