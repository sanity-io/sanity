/* eslint-disable no-console, class-methods-use-this */
import React from 'react'
import LinkButton from 'part:@sanity/components/buttons/anchor'
import Spinner from 'part:@sanity/components/loading/spinner'
import studioHintsConfig from 'part:@sanity/default-layout/studio-hints-config'
import WarningIcon from 'part:@sanity/base/warning-icon'
import {getHints} from '../datastore'
import {resolveUrl} from './utils'
import LinksList from './LinksList'
import styles from './HintsPackage.css'

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
      <div className={`${styles.root} ${styles.withError}`}>
        <div className={styles.errorWrapper}>
          <h2 className={styles.errorTitle}>
            <WarningIcon />
            {title}
          </h2>
          <p className={styles.errorMessage}>{message}</p>
        </div>
      </div>
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
        <div className={styles.root}>
          <Spinner message="Loading hints" />
        </div>
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
      <div className={styles.root}>
        <div className={styles.header}>
          <h2 className={styles.trayTitle}>{title}</h2>
        </div>

        <div className={styles.content}>
          <div>
            <LinksList title={linksTitle} links={links} repoId={repoId} />
          </div>
          <div>
            <LinksList type="card" title={hintsTitle} links={hints} repoId={repoId} />
          </div>
        </div>

        <div className={styles.footer}>
          {sidebarRemovalInstructions && (
            <LinkButton
              color="primary"
              href={resolveUrl(sidebarRemovalInstructions)}
              rel="noopener noreferrer"
              tone="navbar"
              target="_blank"
            >
              How to remove this?
            </LinkButton>
          )}
        </div>
      </div>
    )
  }
}
