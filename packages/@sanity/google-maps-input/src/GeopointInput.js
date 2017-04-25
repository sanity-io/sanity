import PropTypes from 'prop-types'
import React from 'react'
import config from 'config:@sanity/google-maps-input'
import GoogleMapsLoadProxy from './GoogleMapsLoadProxy'
import GeopointSelect from './GeopointSelect'
import Button from 'part:@sanity/components/buttons/default'
import Dialog from 'part:@sanity/components/dialogs/default'
import Fieldset from 'part:@sanity/components/fieldsets/default'
import styles from '../styles/GeopointInput.css'
import PatchEvent, {set} from '@sanity/form-builder/PatchEvent'


const getLocale = context => {
  const intl = context.intl || {}
  return (
    intl.locale
    || (typeof window !== 'undefined' && window.navigator.language)
    || 'en'
  )
}

class GeopointInput extends React.Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    value: PropTypes.shape({
      lat: PropTypes.number,
      lng: PropTypes.number
    }),
    type: PropTypes.shape({
      title: PropTypes.string.isRequired,
      description: PropTypes.string,
    })
  };

  static contextTypes = {
    intl: PropTypes.shape({
      locale: PropTypes.string
    })
  };

  constructor() {
    super()

    this.handleToggleModal = this.handleToggleModal.bind(this)
    this.handleCloseModal = this.handleCloseModal.bind(this)

    this.state = {
      dragMarkerInitialPosition: null,
      modalOpen: false
    }
  }

  handleToggleModal() {
    this.setState({modalOpen: !this.state.modalOpen})
  }

  handleChange = latLng => {
    const {type, onChange} = this.props
    onChange(PatchEvent.from(set({
      _type: type.name,
      lat: latLng.lat(),
      lng: latLng.lng()
    })))
  }

  handleCloseModal() {
    this.setState({modalOpen: false})
  }

  getStaticImageUrl(value) {
    const loc = `${value.lat},${value.lng}`
    const params = {
      key: config.apiKey,
      center: loc,
      markers: loc,
      zoom: 13,
      size: '700x200'
    }

    const qs = Object.keys(params).reduce((res, param) => {
      return res.concat(`${param}=${encodeURIComponent(params[param])}`)
    }, [])

    return `https://maps.googleapis.com/maps/api/staticmap?${qs.join('&')}`
  }

  render() {
    const {value, type} = this.props

    if (!config || !config.apiKey) {
      return (
        <div>
          <p>API key for Google Maps is not defined. This plugin needs API access to:</p>
          <ul>
            <li>Google Maps JavaScript API</li>
            <li>Google Places API Web Service</li>
            <li>Google Static Maps API</li>
          </ul>
          <p>
            Please define an API key with access to these services in
            <code style={{whitespace: 'nowrap'}}>`&lt;project-root&gt;/config/google-maps.json`</code>
          </p>
        </div>
      )
    }

    return (
      <Fieldset legend={type.title} descriptions={type.description} className={styles.root}>
        {value && <div>
          <img className={styles.previewImage} src={this.getStaticImageUrl(value)} />
        </div>}

        <div className={styles.functions}>
          <Button onClick={this.handleToggleModal}>
            {value ? 'Edit' : 'Set location'}
          </Button>

          {value && (
            <Button type="button">
              Remove
            </Button>
          )}
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
            <GoogleMapsLoadProxy
              value={value}
              apiKey={config.apiKey}
              onChange={this.handleChange}
              defaultLocation={config.defaultLocation}
              defaultZoom={config.defaultZoom}
              locale={getLocale(this.context)}
              component={GeopointSelect}
            />
          </Dialog>
        )}
      </Fieldset>
    )
  }
}

export default GeopointInput
