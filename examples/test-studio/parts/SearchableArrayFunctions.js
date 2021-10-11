import {SearchIcon, UnknownIcon} from '@sanity/icons'
import {Autocomplete, Box, Card, Flex, Text} from '@sanity/ui'
import React, {createElement} from 'react'
import PropTypes from 'prop-types'
import DefaultArrayFunctions from 'part:@sanity/form-builder/input/array/functions-default'

export default class SearchableArrayFunctions extends React.Component {
  static propTypes = {
    type: PropTypes.shape({
      of: PropTypes.arrayOf(
        PropTypes.shape({
          title: PropTypes.string,
          type: PropTypes.shape({
            name: PropTypes.string.isRequired,
          }).isRequired,
        })
      ),
    }).isRequired,
    value: PropTypes.array,
    readOnly: PropTypes.bool,
    onAppendItem: PropTypes.func.isRequired,
    onCreateValue: PropTypes.func.isRequired,
  }

  static defaultProps = {
    value: [],
    readOnly: false,
  }

  constructor(props) {
    super(props)

    this.state = {results: this.getMatchingResults('', props.type)}
  }

  handleInsertItem = (type) => {
    const {onCreateValue, onAppendItem} = this.props
    const item = onCreateValue(type)
    onAppendItem(item)
  }

  filterOption = () => true

  getMatchingResults = (query, type) => {
    return type.of
      .filter((memberDef) => (memberDef.title || memberDef.type.name).toLowerCase().includes(query))
      .map((memberDef) => ({
        title: memberDef.title || memberDef.type.name,
        type: memberDef.type,
        value: memberDef.name,
      }))
  }

  handleSearch = (query) => {
    this.setState({results: this.getMatchingResults(query || '', this.props.type)})
  }

  handleChange = (value) => {
    const option = this.state.results.find((o) => o.value === value)

    if (option) {
      this.handleInsertItem(option.type)
    }
  }

  renderOption = (option) => {
    return (
      <Card as="button" padding={3} radius={2}>
        <Flex>
          <Text>{createElement(option.type.icon || UnknownIcon)}</Text>
          <Box flex={1} marginLeft={3}>
            <Text textOverflow="ellipsis">{option.title}</Text>
          </Box>
        </Flex>
      </Card>
    )
  }

  render() {
    const {type, readOnly} = this.props

    if (readOnly || type.of.length <= 3) {
      return <DefaultArrayFunctions {...this.props} />
    }

    return (
      <DefaultArrayFunctions {...this.props}>
        <Box paddingLeft={1}>
          <Autocomplete
            filterOption={this.filterOption}
            icon={SearchIcon}
            options={this.state.results}
            onChange={this.handleChange}
            onQueryChange={this.handleSearch}
            placeholder="Type to search…"
            radius={2}
            renderOption={this.renderOption}
          />
        </Box>
      </DefaultArrayFunctions>
    )
  }
}
