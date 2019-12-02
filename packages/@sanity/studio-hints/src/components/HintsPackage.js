/* eslint-disable no-console, class-methods-use-this */
import React from 'react'
import {isEmpty} from 'lodash'
import Spinner from 'part:@sanity/components/loading/spinner'
import studioHintsConfig from 'part:@sanity/default-layout/studio-hints-config'
import WarningIcon from 'part:@sanity/base/warning-icon'
import {locationSetting, getHints, updateLocation} from '../datastore'
import {resolveUrl} from './utils'
import LinksList from './LinksList'
// import HintPage from './HintPage'
import styles from './HintsPackage.css'

const removeHintsArticleSlug = 'remove-this-sidebar'

export default class HintsPackage extends React.PureComponent {
  state = {
    error: null,
    hintsPackage: null,
    sidebarRemovalInstructions: null,
    activePage: null,
    isLoading: true
  }

  subscription = null

  fetchHintsPackage(repoId) {
    getHints(repoId, removeHintsArticleSlug)
      .then(result => {
        const {hintsPackage, sidebarRemovalInstructions} = result
        this.setState({hintsPackage, sidebarRemovalInstructions, isLoading: false})
      })
      .catch(error => this.setState({error, isLoading: false}))
  }

  componentDidMount() {
    const repoId = studioHintsConfig.templateRepoId
    this.fetchHintsPackage(repoId)

    this.subscription = locationSetting.listen().subscribe(currentLocation => {
      this.setState({activePage: currentLocation ? JSON.parse(currentLocation).id : null})
    })
  }

  componentWillUnmount() {
    if (this.subscription) {
      this.subscription.unsubscribe()
    }
  }

  /**
   * Hint cards currently only link to external sources.
   * In future iterations a hint card may have it's own page
   * that opens by clicking the card (onCardClick prop), that
   * then renders the HintPage.js component.
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
          <Spinner message="Loading hints package" />
        </div>
      )
    }

    if (error) {
      return this.renderError(
        'Hints not found',
        'An error occurred while fetching the hints package.'
      )
    }

    if (!hintsPackage || isEmpty(hintsPackage)) {
      return this.renderError('Hints not found', `No hints package found for slug "${repoId}"`)
    }

    const {links, hints, title, hintsTitle, linksTitle} = hintsPackage
    return (
      <div className={styles.root}>
        <h2 className={styles.trayTitle}>{title}</h2>
        <LinksList title={linksTitle} links={links} />
        <LinksList type="card" title={hintsTitle} links={hints} />
        <div className={styles.footer}>
          {sidebarRemovalInstructions && (
            <a
              href={resolveUrl(sidebarRemovalInstructions)}
              className={styles.removeHintsLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              How to remove this?
            </a>
          )}
        </div>
      </div>
    )
  }
}
