import PropTypes from 'prop-types'
import React from 'react'
import config from 'config:@sanity/google-maps-input'
import Button from 'part:@sanity/components/buttons/default'
import Dialog from 'part:@sanity/components/dialogs/default'
import Fieldset from 'part:@sanity/components/fieldsets/default'
import {PatchEvent, set, setIfMissing, unset} from 'part:@sanity/form-builder/patch-event'
import ButtonGrid from 'part:@sanity/components/buttons/button-grid'
import EditIcon from 'part:@sanity/base/edit-icon'
import styles from '../styles/GeopointInput.css'
import GeopointSelect from './GeopointSelect'
import GoogleMapsLoadProxy from './GoogleMapsLoadProxy'

const getLocale = context => {
  const intl = context.intl || {}
  return intl.locale || (typeof window !== 'undefined' && window.navigator.language) || 'en'
}

const getStaticImageUrl = value => {
  const loc = `${value.lat},${value.lng}`
  const params = {
    key: config.apiKey,
    center: loc,
    markers: loc,
    zoom: 13,
    scale: 2,
    size: '640x300'
  }

  const qs = Object.keys(params).reduce((res, param) => {
    return res.concat(`${param}=${encodeURIComponent(params[param])}`)
  }, [])

  return `https://maps.googleapis.com/maps/api/staticmap?${qs.join('&')}`
}

class GeopointInput extends React.Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    markers: PropTypes.arrayOf(
      PropTypes.shape({
        type: PropTypes.string
      })
    ),
    value: PropTypes.shape({
      lat: PropTypes.number,
      lng: PropTypes.number
    }),
    type: PropTypes.shape({
      title: PropTypes.string.isRequired,
      description: PropTypes.string
    })
  }

  static defaultProps = {
    markers: []
  }

  static contextTypes = {
    intl: PropTypes.shape({
      locale: PropTypes.string
    })
  }

  constructor() {
    super()

    this.handleToggleModal = this.handleToggleModal.bind(this)
    this.handleCloseModal = this.handleCloseModal.bind(this)

    this.state = {
      modalOpen: false
    }
  }

  handleToggleModal() {
    this.setState(prevState => ({modalOpen: !prevState.modalOpen}))
  }

  handleChange = latLng => {
    const {type, onChange} = this.props
    onChange(
      PatchEvent.from([
        setIfMissing({
          _type: type.name
        }),
        set(latLng.lat(), ['lat']),
        set(latLng.lng(), ['lng'])
      ])
    )
  }

  handleClear = () => {
    const {onChange} = this.props
    onChange(PatchEvent.from(unset()))
  }

  handleCloseModal() {
    this.setState({modalOpen: false})
  }

  render() {
    const {value, type, markers} = this.props

    if (!config || !config.apiKey) {
      return (
        <div>
          <p>
            The <a href="https://sanity.io/docs/schema-types/geopoint-type">Geopoint type</a> needs
            a Google Maps API key with access to:
          </p>
          <ul>
            <li>Google Maps JavaScript API</li>
            <li>Google Places API Web Service</li>
            <li>Google Static Maps API</li>
          </ul>
          <p>
            Please enter the API key with access to these services in
            <code style={{whitespace: 'nowrap'}}>
              `&lt;project-root&gt;/config/@sanity/google-maps-input.json`
            </code>
          </p>
        </div>
      )
    }

    return (
      <Fieldset
        legend={type.title}
        description={type.description}
        className={styles.root}
        markers={markers}
      >
        <div>
          {value && (
            <div className={styles.map}>
              <img
                className={styles.previewImage}
                src={getStaticImageUrl(value)}
                alt="Map location"
              />
            </div>
          )}

          <div className={styles.functions}>
            <ButtonGrid>
              <Button inverted onClick={this.handleToggleModal} icon={value && EditIcon}>
                {value ? 'Edit' : 'Set location'}
              </Button>

              {value && (
                <Button color="danger" inverted type="button" onClick={this.handleClear}>
                  Remove
                </Button>
              )}
            </ButtonGrid>
          </div>

          {this.state.modalOpen && (
            <Dialog
              title="Place on map"
              onClose={this.handleCloseModal}
              onCloseClick={this.handleCloseModal}
              onOpen={this.handleOpenModal}
              message="Select location by dragging the marker or search for a place"
              isOpen={this.state.modalOpen}
            >
              <div className={styles.dialogInner}>
                <GoogleMapsLoadProxy
                  value={value}
                  apiKey={config.apiKey}
                  onChange={this.handleChange}
                  defaultLocation={config.defaultLocation}
                  defaultZoom={config.defaultZoom}
                  locale={getLocale(this.context)}
                  component={GeopointSelect}
                />
              </div>
            </Dialog>
          )}
        </div>
      </Fieldset>
    )
  }
}

export default GeopointInput
