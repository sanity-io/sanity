import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../../FormBuilderPropTypes'
import {bindAll} from 'lodash'
import ItemPreview from './ItemPreview'
import {createFieldValue} from '../../state/FormBuilderState'
import Button from 'component:@sanity/components/buttons/default'
import styles from './styles/Reference.css'

export default class Reference extends React.Component {
  static propTypes = {
    type: FormBuilderPropTypes.type,
    field: FormBuilderPropTypes.field,
    value: PropTypes.object,
    searchFn: PropTypes.func,
    materializeReferences: PropTypes.func,
    onChange: PropTypes.func
  };

  static defaultProps = {
    onChange() {}
  };

  static contextTypes = {
    resolveInputComponent: PropTypes.func,
    schema: PropTypes.object
  };

  constructor(props, ...rest) {
    super(props, ...rest)
    bindAll(this, [
      'handleSearchFieldChange',
      'handleSelectItem',
      'createValueFromHit',
      'handleClearValue',
      'handleShowInput',
    ])

    this.state = {
      searchInputValue: '',
      query: null,
      hits: [],
      refCache: {},
      showInput: props.value.isEmpty(),
      materializedValue: null,
      searching: false
    }
    this._currentQuery = null
  }

  componentWillMount() {
    this.loadValue(this.props.value)
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.value !== this.props.value) {
      this.loadValue(nextProps.value)
    }
  }

  clearSearch() {
    this.setState({
      hits: [],
      searching: false,
      searchInputValue: '',
      query: null
    })
  }

  getItemFieldForType(typeName) {
    const {type} = this.props
    return type.to.find(ofType => {
      return ofType.type === typeName
    })
  }

  handleSelectItem(event) {
    const {onChange} = this.props

    const refId = event.currentTarget.getAttribute('data-id')
    const refType = event.currentTarget.getAttribute('data-type')
    const patch = {
      $set: {
        $type: 'reference',
        $refType: refType,
        $ref: refId
      }
    }

    this.setState({
      showInput: false
    })

    onChange({patch: patch})
  }

  loadValue(value) {
    const {materializeReferences} = this.props

    if (value.isEmpty()) {
      return
    }

    const materialize = materializeReferences([value.refId])
      .then(materializedRefs => {
        return this.createValueFromDoc(materializedRefs[0])
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

  handleShowInput(event) {
    this.setState({showInput: true})
    this.search(this.state.searchInputValue)
  }

  handleClearValue(event) {
    event.preventDefault()
    const {onChange} = this.props
    onChange({patch: {$set: undefined}})
    this.clearSearch()
  }

  handleSearchFieldChange(event) {
    const inputValue = event.currentTarget.value
    this.setState({searchInputValue: inputValue})
    this.search(inputValue)
  }

  createValueFromDoc(doc) {
    return createFieldValue(doc, {
      field: this.getItemFieldForType(doc.$type),
      schema: this.context.schema,
      resolveInputComponent: this.context.resolveInputComponent
    })
  }
  createValueFromHit(hit) {
    return this.createValueFromDoc(hit.document)
  }

  search(query) {
    const {searchFn} = this.props
    if (this._currentQuery === query) {
      return
    }

    this._currentQuery = query

    if (!query) {
      return
    }

    this.setState({searching: true})

    searchFn(query)
      .then(hits => {
        if (this._currentQuery !== query) {
          return // ignore
        }

        const preparedHits = hits.map(hit => {
          return Object.assign({}, hit, {
            value: this.createValueFromHit(hit)
          })
        })

        const updatedCache = preparedHits.reduce((cache, hit) => {
          cache[hit.value.value.$id] = hit.value
          return cache
        }, Object.assign({}, this.state.refCache))

        this.setState({
          hits: preparedHits,
          searching: false,
          refCache: updatedCache,
          query: query
        })
      })
  }

  renderHit(hit) {
    const itemField = this.getItemFieldForType(hit.document.$type)

    // todo: make rendering strategy for hits injectable as prop
    return (
      <div onMouseDown={this.handleSelectItem} data-id={hit.document.$id} data-type={hit.document.$type}>
        <ItemPreview highlight={hit.match} value={hit.value} field={itemField} />
      </div>
    )
  }

  renderHits(hits) {
    return (
      <ul style={{maxHeight: 400, overflowY: 'auto'}}>
        {hits.map((hit, i) => <li className={styles.hit} key={hit.key || i}>{this.renderHit(hit, i)}</li>)}
      </ul>
    )
  }

  renderInput() {
    const {searching, query, searchInputValue, hits} = this.state

    function renderStatus() {
      if (!searchInputValue) {
        return null
      }
      if (searching) {
        return `Searching for ${JSON.stringify(searchInputValue)}…`
      }
      return `${hits.length || 'No'} hit${hits.length === 1 ? '' : 's'} for ${JSON.stringify(query)}:`
    }

    return (
      <div className={styles.input}>
        <input
          type="search"
          value={searchInputValue}
          placeholder="Type to find"
          onChange={this.handleSearchFieldChange}
          className={styles.searchInput}

          ref={ref => {
            this.searchInput = ref
          }}
          onKeyDown={e => {
            if (e.key === 'Escape') {
              e.preventDefault()
              this.setState({showInput: false})
            }
          }}
          onBlur={e => {
            this.setState({showInput: false})
          }}
        />
        {searchInputValue && (
          <div>
            <div>{renderStatus()}</div>
            {this.renderHits(hits, query)}
          </div>
        )}
      </div>
    )
  }

  renderValue() {
    const {value} = this.props
    const {refCache} = this.state

    const materializedValue = refCache[value.refId]
    if (!materializedValue) {
      return <div>Loading…</div>
    }

    // Todo: make context.field an official / formalized thing
    const itemField = materializedValue.context.field

    return (
      <div className={styles.input}>
        <div
          tabIndex="0"
          onFocus={this.handleShowInput}
          onClick={this.handleShowInput}
        >
          <ItemPreview
            field={itemField}
            value={materializedValue}
          />
        </div>
        <Button className={styles.clearButton} onClick={this.handleClearValue}>x</Button>
      </div>
    )
  }

  render() {
    const {value} = this.props
    const {showInput} = this.state
    return (
      <div className={styles.root}>
        {(showInput || value.isEmpty()) ? this.renderInput() : this.renderValue()}
      </div>
    )
  }

  componentDidUpdate(prevProps, prevState) {
    if (!prevState.showInput && this.state.showInput) {
      this.searchInput.focus()
    }
  }
}
