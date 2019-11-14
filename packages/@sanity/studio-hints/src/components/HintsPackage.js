/* eslint-disable no-console */
/* eslint-disable class-methods-use-this */
import React from 'react'
import PropTypes from 'prop-types'
import {isEmpty} from 'lodash'
import {locationSetting, updateLocation} from 'part:@sanity/studio-hints/datastore'
import Spinner from 'part:@sanity/components/loading/spinner'
import studioHintsConfig from 'part:@sanity/studio-hints/config'
import client from '../client'
import Links from './Links'
import HintPage from './HintPage'
import HintCard from './HintCard'
import styles from './HintsPackage.css'

class HintsPackage extends React.PureComponent {
  static props = {
    slug: PropTypes.string.isRequired
  }

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
        hints[]->{_id, title, summary, body}
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
      return <HintPage hint={this.activeHint()} onBackClick={this.handleBackClick} />
    }

    const {links, hints, hintsTitle} = hintsPackage
    return (
      <>
        <Links links={links} />
        <div className={styles.cardsList}>
          <h2 className={styles.cardsTitle}>{hintsTitle}</h2>
          {hints &&
            hints.map(hint => {
              return <HintCard key={hint._id} card={hint} onCardClick={this.handleCardClick} />
            })}
          {!hints && <p>No hints in this package</p>}
        </div>
      </>
    )
  }
}

export default HintsPackage
