/* eslint-disable no-console, class-methods-use-this */
import React from 'react'
import studioHintsConfig from 'part:@sanity/default-layout/studio-hints-config'
import {Card, Text, Heading, Stack, Flex, Inline, Spinner, Button, Box} from '@sanity/ui'
import {WarningOutlineIcon, InfoOutlineIcon} from '@sanity/icons'
import {getHints} from '../datastore'
import {resolveUrl} from './utils'
import LinksList from './LinksList'

const removeHintsArticleSlug = 'remove-this-sidebar'

export default class HintsPackage extends React.PureComponent {
  state = {
    error: null,
    hintsPackage: null,
    sidebarRemovalInstructions: null,
    isLoading: true,
  }

  subscription = null

  fetchHintsPackage(repoId) {
    this.fetchSubscription = getHints(repoId, removeHintsArticleSlug).subscribe({
      next: (result) => {
        const {hintsPackage, sidebarRemovalInstructions} = result
        this.setState({hintsPackage, sidebarRemovalInstructions, isLoading: false})
      },
      error: (error) => {
        this.setState({error, isLoading: false})
      },
    })
  }

  componentDidMount() {
    const repoId = studioHintsConfig.templateRepoId
    this.fetchHintsPackage(repoId)
  }

  componentWillUnmount() {
    if (this.subscription) {
      this.subscription.unsubscribe()
    }

    if (this.fetchSubscription) {
      this.fetchSubscription.unsubscribe()
    }
  }

  /**
   * Hint cards currently only link to external sources.
   * In future iterations a hint card may have it's own page
   * that opens by clicking the card (onCardClick prop), that
   * then renders a page component.
   * These are the handlers for opening and closing hint pages:
   */
  /*
  handleCardClick = id => {
    const locationObject = {type: 'hint', id}
    updateLocation(locationObject)
  }
  handleBackClick = () => {
    updateLocation(null)
  }
  activeHint = () => {
    const {activePage, hintsPackage} = this.state
    return activePage ? hintsPackage.hints.find(hint => hint._id === activePage) : null
  }
  getNextHint = () => {
    const {hints = []} = this.state.hintsPackage
    if (!this.activeHint) {
      return -1
    }
    for (let i = 0; i < hints.length; i++) {
      // if (hints[i]._id === this.activeHint()._id) {
      //   return hints[i + 1]
      // }
    }
    return -1
  }
  */

  renderError(title, message) {
    return (
      <Stack space={4} paddingX={4} paddingY={5}>
        <Flex justify="center" align="center">
          <Inline space={2}>
            <Heading size={1}>
              <WarningOutlineIcon />
            </Heading>
            <Heading size={1}>{title}</Heading>
          </Inline>
        </Flex>
        <Text size={1} align="center">
          {message}
        </Text>
      </Stack>
    )
  }

  render() {
    const {hintsPackage, sidebarRemovalInstructions, error, isLoading} = this.state
    const repoId = studioHintsConfig.templateRepoId

    if (!repoId) {
      return this.renderError(
        'Configuration missing',
        <span>
          The <code>studioHintsConfig</code> does not contain a hints package slug.
        </span>
      )
    }
    if (isLoading) {
      return (
        <Flex
          justify="center"
          align="center"
          paddingX={4}
          paddingY={5}
          flex={1}
          direction="column"
          gap={3}
        >
          <Spinner muted />
          <Text size={1} muted>
            Loading hints
          </Text>
        </Flex>
      )
    }

    if (error) {
      return this.renderError('Hints not found', 'An error occurred while fetching the hints.')
    }

    if (!hintsPackage || !hintsPackage.hintsTitle) {
      return this.renderError('Hints not found', `No hints found for slug "${repoId}"`)
    }

    const {links, hints, title, hintsTitle, linksTitle} = hintsPackage
    return (
      <Flex direction="column">
        <Card padding={2} borderBottom tone="inherit" sizing="border">
          <Box padding={2}>
            <Heading size={1} as="h2">
              {title}
            </Heading>
          </Box>
        </Card>

        <Box overflow="auto" paddingX={4} paddingY={5} flex={1}>
          <Stack space={5}>
            <Box>
              <LinksList title={linksTitle} links={links} repoId={repoId} />
            </Box>
            <Box>
              <LinksList type="card" title={hintsTitle} links={hints} repoId={repoId} />
            </Box>
          </Stack>
        </Box>

        {sidebarRemovalInstructions && (
          <Card borderTop padding={3} tone="inherit">
            <Button
              as="a"
              text="How to remove this?"
              href={resolveUrl(sidebarRemovalInstructions)}
              rel="noopener noreferrer"
              target="_blank"
              tone="primary"
              style={{width: '100%'}}
              mode="bleed"
              icon={InfoOutlineIcon}
            />
          </Card>
        )}
      </Flex>
    )
  }
}
