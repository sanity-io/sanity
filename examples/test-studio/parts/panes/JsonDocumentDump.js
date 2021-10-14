import {Box, Code, Flex, Spinner, Text} from '@sanity/ui'
import sanityClient from 'part:@sanity/base/client'
import PropTypes from 'prop-types'
import React from 'react'

const client = sanityClient.withConfig({apiVersion: '1'})

export default class JsonDocumentDump extends React.PureComponent {
  static propTypes = {
    itemId: PropTypes.string.isRequired,
  }

  state = {isLoading: true}

  actionHandlers = {
    reload: () => this.setup(),
  }

  setup() {
    this.dispose()
    this.setState({isLoading: true, document: undefined})

    const {itemId} = this.props
    const draftId = `drafts.${itemId}`
    const query = '*[_id in [$itemId, $draftId]]'
    const params = {itemId, draftId}

    this.document$ = client.observable
      .fetch(`${query} | order(_updatedAt desc) [0]`, params)
      .subscribe((document) => this.setState({document, isLoading: false}))

    this.documentListener$ = client.observable
      .listen(query, params)
      .subscribe((mut) => this.setState({document: mut.result, isLoading: false}))
  }

  dispose() {
    if (this.document$) {
      this.document$.unsubscribe()
    }

    if (this.documentListener$) {
      this.documentListener$.unsubscribe()
    }
  }

  componentDidMount() {
    this.setup()
  }

  componentWillUnmount() {
    this.dispose()
  }

  render() {
    const {isLoading, document} = this.state

    if (isLoading) {
      return (
        <Flex align="center" direction="column" height="fill" justify="center">
          <Spinner muted />
          <Box marginTop={3}>
            <Text align="center" muted size={1}>
              Loading document…
            </Text>
          </Box>
        </Flex>
      )
    }

    if (!document) {
      return (
        <Box padding={4}>
          <Text muted>Document not found.</Text>
        </Box>
      )
    }

    return (
      <Box height="fill" overflow="auto" padding={4} sizing="border">
        <Code language="json" size={[1, 1, 2]}>
          {JSON.stringify(document, null, 2)}
        </Code>
      </Box>
    )
  }
}
