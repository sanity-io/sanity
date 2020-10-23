/* eslint-disable complexity */
import React from 'react'
import PropTypes from 'prop-types'
import queryString from 'query-string'
import {storeState, getState} from '../util/localState'
import parseApiQueryString from '../util/parseApiQueryString'
import tryParseParams from '../util/tryParseParams'
import DelayedSpinner from './DelayedSpinner'
import QueryEditor from './QueryEditor'
import ParamsEditor from './ParamsEditor'
import ResultView from './ResultView'
import NoResultsDialog from './NoResultsDialog'
import QueryErrorDialog from './QueryErrorDialog'
import SplitPane from 'react-split-pane'
import encodeQueryString from '../util/encodeQueryString'

// eslint-disable-next-line import/no-unassigned-import
import 'codemirror/lib/codemirror.css?raw'
// eslint-disable-next-line import/no-unassigned-import
import 'codemirror/theme/material.css?raw'
// eslint-disable-next-line import/no-unassigned-import
import 'codemirror/addon/hint/show-hint.css?raw'

// eslint-disable-next-line import/no-unassigned-import
import 'codemirror/lib/codemirror.css?raw'
// eslint-disable-next-line import/no-unassigned-import
import 'codemirror/theme/material.css?raw'
// eslint-disable-next-line import/no-unassigned-import
import 'codemirror/addon/hint/show-hint.css?raw'

const sanityUrl = /\.api\.sanity\.io.*?(?:query|listen)\/(.*?)\?(.*)/

const handleCopyUrl = () => {
  const emailLink = document.querySelector('#vision-query-url')
  emailLink.select()

  try {
    document.execCommand('copy')
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Unable to copy to clipboard :(')
  }
}

class VisionGui extends React.PureComponent {
  constructor(props, context) {
    super(props, context)

    const lastQuery = getState('lastQuery')
    const lastParams = getState('lastParams')

    const firstDataset = this.props.datasets[0] && this.props.datasets[0].name
    const defaultDataset = context.client.config().dataset || firstDataset

    let dataset = getState('dataset', defaultDataset)

    if (!this.props.datasets.some(({name}) => name === dataset)) {
      dataset = defaultDataset
    }

    this._queryEditorContainer = React.createRef()
    this._paramsEditorContainer = React.createRef()

    this.subscribers = {}
    this.state = {
      query: lastQuery,
      params: lastParams && tryParseParams(lastParams),
      rawParams: lastParams,
      queryInProgress: false,
      dataset,
    }

    this.handleChangeDataset = this.handleChangeDataset.bind(this)
    this.handleListenExecution = this.handleListenExecution.bind(this)
    this.handleListenerMutation = this.handleListenerMutation.bind(this)
    this.handleQueryExecution = this.handleQueryExecution.bind(this)
    this.handleQueryChange = this.handleQueryChange.bind(this)
    this.handleParamsChange = this.handleParamsChange.bind(this)
    this.handlePaste = this.handlePaste.bind(this)
  }

  componentDidMount() {
    this.context.client.config({dataset: this.state.dataset})
    window.document.addEventListener('paste', this.handlePaste)
  }

  componentWillUnmount() {
    this.cancelQuery()
    this.cancelListener()
  }

  handlePaste(evt) {
    const data = evt.clipboardData.getData('text/plain')
    const match = data.match(sanityUrl)
    if (!match) {
      return
    }

    const [, dataset, urlQuery] = match
    const qs = queryString.parse(urlQuery)
    let parts

    try {
      parts = parseApiQueryString(qs)
    } catch (err) {
      console.warn('Error while trying to parse API URL: ', err.message) // eslint-disable-line no-console
      return // Give up on error
    }

    if (this.context.client.config().dataset !== dataset) {
      this.handleChangeDataset({target: {value: dataset}})
    }

    evt.preventDefault()
    this.setState({
      query: parts.query,
      params: parts.params,
      rawParams: JSON.stringify(parts.params, null, 2),
    })
  }

  cancelQuery() {
    if (!this.subscribers.query) {
      return
    }

    this.subscribers.query.unsubscribe()
    this.subscribers.query = null
  }

  cancelListener() {
    if (!this.subscribers.listen) {
      return
    }

    this.subscribers.listen.unsubscribe()
    this.subscribers.listen = null
  }

  handleChangeDataset(evt) {
    const dataset = evt.target.value
    storeState('dataset', dataset)
    this.setState({dataset})
    this.context.client.config({dataset})
    this.handleQueryExecution()
  }

  handleListenerMutation(mut) {
    // eslint-disable-next-line react/no-access-state-in-setstate
    const listenMutations = [mut].concat(this.state.listenMutations)
    if (listenMutations.length > 50) {
      listenMutations.pop()
    }

    this.setState({listenMutations})
  }

  handleListenExecution() {
    const {query, params, rawParams, listenInProgress} = this.state
    if (listenInProgress) {
      this.cancelListener()
      this.setState({listenInProgress: false})
      return
    }

    const client = this.context.client
    const paramsError = params instanceof Error && params
    const url = client.getUrl(client.getDataUrl('listen', encodeQueryString(query, params)))
    storeState('lastQuery', query)
    storeState('lastParams', rawParams)

    this.cancelQuery()

    this.setState({
      url,
      listenMutations: [],
      queryInProgress: false,
      listenInProgress: !paramsError && Boolean(query),
      error: paramsError || undefined,
      result: undefined,
      queryTime: null,
      e2eTime: null,
    })

    if (!query || paramsError) {
      return
    }

    this.subscribers.listen = client.listen(query, params, {}).subscribe({
      next: this.handleListenerMutation,
      error: (error) =>
        this.setState({
          error,
          query,
          listenInProgress: false,
        }),
    })
  }

  handleQueryExecution() {
    const {query, params, rawParams} = this.state
    const client = this.context.client.observable
    const paramsError = params instanceof Error && params
    storeState('lastQuery', query)
    storeState('lastParams', rawParams)

    this.cancelListener()

    this.setState({
      queryInProgress: !paramsError && Boolean(query),
      listenInProgress: false,
      listenMutations: [],
      error: paramsError || undefined,
      result: undefined,
      queryTime: null,
      e2eTime: null,
    })

    if (!query || paramsError) {
      return
    }

    const url = client.getUrl(client.getDataUrl('query', encodeQueryString(query, params)))
    const queryStart = Date.now()

    this.subscribers.query = client.fetch(query, params, {filterResponse: false}).subscribe({
      next: (res) =>
        this.setState({
          query,
          url,
          queryTime: res.ms,
          e2eTime: Date.now() - queryStart,
          result: res.result,
          queryInProgress: false,
          error: null,
        }),
      error: (error) =>
        this.setState({
          error,
          query,
          queryInProgress: false,
        }),
    })
  }

  handleQueryChange(data) {
    this.setState({query: data.query})
  }

  handleParamsChange(data) {
    this.setState({rawParams: data.raw, params: data.parsed})
  }

  render() {
    const {client, components} = this.context
    const {
      error,
      result,
      url,
      query,
      queryInProgress,
      listenInProgress,
      queryTime,
      e2eTime,
      listenMutations,
    } = this.state
    const {Button, Select} = components
    const styles = this.context.styles.visionGui
    const dataset = client.config().dataset
    const datasets = this.props.datasets.map((set) => set.name)
    const hasResult = !error && !queryInProgress && typeof result !== 'undefined'

    // Note that because of react-json-inspector, we need at least one
    // addressable, non-generated class name. Therefore;
    // leave `sanity-vision` untouched!
    const visionClass = ['sanity-vision', this.context.styles.visionGui.root]
      .filter(Boolean)
      .join(' ')
    const headerClass = ['sanity-vision', this.context.styles.visionGui.header]
      .filter(Boolean)
      .join(' ')
    return (
      <div className={visionClass}>
        <div className={headerClass}>
          <div className={styles.headerLeft}>
            <label className={styles.datasetSelectorContainer}>
              <span className={styles.datasetLabel}>Dataset</span>
              <Select
                value={this.state.dataset || client.config().dataset}
                values={datasets}
                onChange={this.handleChangeDataset}
              />
            </label>
          </div>
          {typeof url === 'string' && (
            <div className={styles.queryUrlContainer}>
              <div>
                Query URL&nbsp;
                <a onClick={handleCopyUrl} className={styles.queryUrlCopy}>
                  copy
                </a>
              </div>
              <div className={styles.queryUrlLine}>
                <input className={styles.queryUrl} readOnly id="vision-query-url" value={url} />
              </div>
            </div>
          )}
          <div className={styles.queryTimingContainer}>
            {typeof queryTime === 'number' && (
              <p
                className={
                  queryTime > 0.5
                    ? styles.queryTiming || 'queryTiming'
                    : styles.queryTimingLong || 'queryTiming'
                }
              >
                Query time
                <br />
                <span>
                  {queryTime}ms (end-to-end: {e2eTime}ms)
                </span>
              </p>
            )}
          </div>
          <div className={styles.headerFunctions}>
            <Button
              onClick={this.handleListenExecution}
              loading={listenInProgress}
              color="white"
              inverted
            >
              Listen
            </Button>

            <Button onClick={this.handleQueryExecution} loading={queryInProgress} color="primary">
              Run query
            </Button>
          </div>
        </div>
        <div className={styles.splitContainer}>
          <SplitPane split="vertical" minSize={150} defaultSize={400}>
            <div className={styles.edit}>
              <SplitPane split="horizontal" defaultSize={'80%'}>
                <div className={styles.inputContainer} ref={this._queryEditorContainer}>
                  <h3 className={styles.inputLabelQuery || 'query'}>Query</h3>
                  <QueryEditor
                    className={styles.queryEditor}
                    value={this.state.query}
                    onExecute={this.handleQueryExecution}
                    onChange={this.handleQueryChange}
                    schema={this.props.schema}
                  />
                </div>
                <div className={styles.inputContainer} ref={this._paramsEditorContainer}>
                  <h3 className={styles.inputLabelQuery || 'query'}>Params</h3>
                  <ParamsEditor
                    className={styles.paramsEditor}
                    classNameInvalid={styles.paramsEditorInvalid}
                    value={this.state.rawParams}
                    onExecute={this.handleQueryExecution}
                    onChange={this.handleParamsChange}
                  />
                </div>
              </SplitPane>
            </div>
            <div className={styles.resultContainer}>
              <h3 className={styles.inputLabelQuery || 'resultLabel'}>Result</h3>
              <div className={styles.result}>
                {queryInProgress && <DelayedSpinner />}
                {error && <QueryErrorDialog error={error} />}
                {hasResult && <ResultView data={result} query={query} />}
                {Array.isArray(result) && result.length === 0 && (
                  <div className={styles.noResult}>
                    <NoResultsDialog query={query} dataset={dataset} />
                  </div>
                )}
                {listenMutations && listenMutations.length > 0 && (
                  <ResultView data={listenMutations} />
                )}
              </div>
            </div>
          </SplitPane>
        </div>
      </div>
    )
  }
}

VisionGui.propTypes = {
  schema: PropTypes.object,
  datasets: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
    })
  ),
}

VisionGui.contextTypes = {
  client: PropTypes.shape({fetch: PropTypes.func}).isRequired,
  styles: PropTypes.object,
  components: PropTypes.object,
}

export default VisionGui
