/* eslint-disable complexity */
import React from 'react'
import {uniqueId} from 'lodash'
import {FormField} from '@sanity/base/components'
import {
  isValidationErrorMarker,
  Marker,
  Path,
  Reference,
  ReferenceFilterSearchOptions,
  ReferenceSchemaType,
  SanityDocument,
} from '@sanity/types'
import {FOCUS_TERMINATOR, get} from '@sanity/util/paths'
import {ChangeIndicatorCompareValueProvider} from '@sanity/base/lib/change-indicators/ChangeIndicator'
import {LinkIcon} from '@sanity/icons'
import {Button, Stack, Text} from '@sanity/ui'
import {Observable} from 'rxjs'
import {IntentLink, SearchableSelect} from '../../legacyParts'
import Preview from '../../Preview'
import subscriptionManager from '../../utils/subscriptionManager'
import PatchEvent, {set, setIfMissing, unset} from '../../PatchEvent'
import withDocument from '../../utils/withDocument'
import withValuePath from '../../utils/withValuePath'
import {Alert} from '../../components/Alert'
import styles from './styles/ReferenceInput.css'

type SearchHit = {
  _id: string
  _type: string
}
type PreviewSnapshot = {
  _type: string
  title: string
  description: string
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
  compareValue?: Reference
  type: ReferenceSchemaType
  markers: Marker[]
  focusPath: Path
  readOnly?: boolean
  onSearch: (
    query: string,
    type: ReferenceSchemaType,
    options: ReferenceFilterSearchOptions
  ) => Observable<SearchHit[]>
  onFocus: (path: Path) => void
  getPreviewSnapshot: (reference, type) => Observable<PreviewSnapshot>
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
    refCache: {},
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

      // eslint-disable-next-line camelcase
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
          getPreviewSnapshot(value, type).subscribe((snapshot) => {
            this.setState({previewSnapshot: snapshot, isMissing: !snapshot})
          })
        )
      }
      getMemberTypeFor(typeName: string) {
        const {type} = this.props
        return type.to.find((ofType) => ofType.type.name === typeName)
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
              _ref: item._id,
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

      resolveUserDefinedFilter = () => {
        const {type, document, getValuePath} = this.props
        const options = type.options
        if (!options) {
          return {}
        }

        const filter = options.filter
        const params = 'filterParams' in options ? options.filterParams : undefined
        if (typeof filter === 'function') {
          const parentPath = getValuePath().slice(0, -1)
          const parent = get(document, parentPath) as Record<string, unknown>
          return filter({document, parentPath, parent})
        }

        return {filter, params}
      }
      search = async (query: string) => {
        this.setState({
          isFetching: true,
        })

        const {type, onSearch} = this.props
        const options = await this.resolveUserDefinedFilter()

        this.subscriptions.replace(
          'search',
          onSearch(query, type, options).subscribe({
            next: (items: Array<SearchHit>) => {
              this.setState((prev) => {
                const updatedCache = items.reduce((cache, item) => {
                  cache[item._id] = item
                  return cache
                }, Object.assign({}, prev.refCache))

                return {
                  hits: items,
                  isFetching: false,
                  refCache: updatedCache,
                }
              })
            },
            error: (err: SearchError) => {
              const isQueryError = err.details && err.details.type === 'queryParseError'
              if (!isQueryError || !options.filter) {
                throw err
              }

              err.message = 'Invalid reference filter, please check `filter`!'
              throw err
            },
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
            params={{id: value._ref, type: previewSnapshot ? previewSnapshot._type : undefined}}
            className={styles.referenceLink}
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
        const {type, value, level, markers, readOnly, presence, compareValue} = this.props
        const {previewSnapshot, isFetching, isMissing, hits} = this.state
        const valueFromHit = value && hits.find((hit) => hit._id === value._ref)
        const weakIs = value && value._weak ? 'weak' : 'strong'
        const weakShouldBe = type.weak === true ? 'weak' : 'strong'

        const hasRef = value && value._ref
        const hasWeakMismatch = hasRef && !isMissing && weakIs !== weakShouldBe
        const errors = markers.filter(isValidationErrorMarker)
        let inputValue = value ? previewSnapshot && previewSnapshot.title : undefined
        if (previewSnapshot && !previewSnapshot.title) {
          inputValue = 'Untitled document'
        }
        const isLoadingSnapshot = value && value._ref && !previewSnapshot
        const placeholder = isLoadingSnapshot ? 'Loading…' : 'Type to search…'
        return (
          <ChangeIndicatorCompareValueProvider
            value={value?._ref}
            compareValue={compareValue?._ref}
          >
            <FormField
              inputId={this._inputId}
              __unstable_markers={markers}
              title={type.title}
              level={level}
              description={type.description}
              __unstable_presence={presence}
            >
              <Stack space={2}>
                {hasWeakMismatch && (
                  <Alert
                    suffix={
                      <Stack padding={2}>
                        <Button
                          onClick={this.handleFixWeak}
                          text={
                            <>
                              Convert to <em>{weakShouldBe}</em> reference
                            </>
                          }
                          tone="caution"
                        />
                      </Stack>
                    }
                    title={
                      <>
                        Reference is not <em>{weakShouldBe}</em>
                      </>
                    }
                  >
                    <Text as="p">
                      This reference is <em>{weakIs}</em>. According to the schema it should be{' '}
                      <em>{weakShouldBe}</em>.
                    </Text>
                  </Alert>
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
              </Stack>
            </FormField>
          </ChangeIndicatorCompareValueProvider>
        )
      }
    }
  )
)
