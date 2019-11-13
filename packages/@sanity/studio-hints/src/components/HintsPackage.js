import React from 'react'
import PropTypes from 'prop-types'
import {locationSetting, updateLocation} from 'part:@sanity/studio-hints/datastore'
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
    activePage: null
  }

  subscription = null

  fetchHintsPackage(slug) {
    client
      .fetch(
        '*[_type == "hintsPackage" && slug.current == $slug][0]{_id, title, slug, links, hintsTitle, hints[]->{_id, title, summary, body}}',
        {slug}
      )
      .then(hintsPackage => {
        this.setState({hintsPackage})
      })
      .catch(error => this.setState({error}))
  }

  componentDidMount() {
    this.fetchHintsPackage(this.props.slug)

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

  render() {
    const {hintsPackage, error, activePage} = this.state

    if (error) {
      return (
        <div>
          <pre>{JSON.stringify(error, null, 2)}</pre>
        </div>
      )
    }
    if (!hintsPackage) {
      return null
    }

    return (
      <div>
        {!activePage && (
          <>
            <Links links={hintsPackage.links} />
            <div className={styles.cardsList}>
              <h2 className={styles.cardsTitle}>{hintsPackage.hintsTitle}</h2>
              {hintsPackage.hints.map(hint => {
                return <HintCard key={hint._id} card={hint} onCardClick={this.handleCardClick} />
              })}
            </div>
          </>
        )}
        {activePage && <HintPage hint={this.activeHint()} onBackClick={this.handleBackClick} />}
      </div>
    )
  }
}

export default HintsPackage
