/* eslint-disable no-console, class-methods-use-this */
import React from 'react'
import {isEmpty} from 'lodash'
import Spinner from 'part:@sanity/components/loading/spinner'
import studioHintsConfig from 'part:@sanity/default-layout/studio-hints-config'
import {locationSetting, updateLocation} from '../datastore'
import client from '../client'
import Links from './Links'
import HintPage from './HintPage'
import HintCard from './HintCard'
import ErrorBoundary from './ErrorBoundary'
import styles from './HintsPackage.css'

export default class HintsPackage extends React.PureComponent {
  state = {
    error: null,
    hintsPackage: null,
    activePage: null,
    isLoading: true
  }

  subscription = null

  fetchHintsPackage(slug) {
    const query = `
      *[_type == "hintsPackage" && slug.current == $slug && !(_id in path('drafts.**'))][0]{
        _id, title, slug, links, hintsTitle,
        hints[]->{
          _id, title, summary,
          body[]{
            ...,
            markDefs[] {
              ...,
              _type == 'internalLink' => {
                ...(@->) {
                  slug,
                  "type": ^._type
                }
              }
            }
          }
        }
      }`
    client
      .fetch(query, {slug})
      .then(hintsPackage => {
        this.setState({hintsPackage, isLoading: false})
      })
      .catch(error => this.setState({error, isLoading: false}))
  }

  componentDidMount() {
    const slug = studioHintsConfig.hintsPackageSlug
    this.fetchHintsPackage(slug)

    this.subscription = locationSetting.listen().subscribe(currentLocation => {
      this.setState({activePage: currentLocation ? JSON.parse(currentLocation).id : null})
    })
  }

  componentWillUnmount() {
    if (this.subscription) {
      this.subscription.unsubscribe()
    }
  }

  handleCardClick = id => {
    // apply transition class first, wait until transitioned out, then change
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

  renderError(message) {
    console.error(message)
    return <p className={styles.errorMessage}>{message}</p>
  }

  render() {
    const {hintsPackage, error, activePage, isLoading} = this.state
    const slug = studioHintsConfig.hintsPackageSlug

    if (!slug) {
      return this.renderError(
        'The studioHintsConfig does not contain a hints package slug. Please check the config file.'
      )
    }

    if (isLoading) {
      return <Spinner message="Loading hints package" />
    }

    if (error) {
      return this.renderError('Error while attempting to fetch hints package')
    }

    if (!hintsPackage || isEmpty(hintsPackage)) {
      return this.renderError(`No hints package found for slug "${slug}"`)
    }

    if (activePage) {
      return (
        <ErrorBoundary onBackClick={this.handleBackClick}>
          <HintPage hint={this.activeHint()} onBackClick={this.handleBackClick} />
        </ErrorBoundary>
      )
    }

    const {links, hints, hintsTitle} = hintsPackage
    return (
      <div className={styles.root}>
        <Links links={links} />
        <h2 className={styles.cardsTitle}>{hintsTitle}</h2>
        {hints &&
          hints.map(hint => {
            return <HintCard key={hint._id} card={hint} onCardClick={this.handleCardClick} />
          })}
        {!hints && <p>No hints in this package</p>}
      </div>
    )
  }
}
