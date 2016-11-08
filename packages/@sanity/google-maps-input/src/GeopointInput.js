import React, {PropTypes} from 'react'
import config from 'config:@sanity/google-maps-input'
import GoogleMapsLoadProxy from './GoogleMapsLoadProxy'
import GeopointSelect from './GeopointSelect'
import {intlShape} from 'part:@sanity/base/locale/intl'
import {formatMessage} from 'part:@sanity/base/locale/formatters'
//import Fieldset from 'part:@sanity/components/fieldsets/default'
import Button from 'part:@sanity/components/buttons/default'
import Dialog from 'part:@sanity/components/dialogs/default'
import Fieldset from 'part:@sanity/components/fieldsets/default'
import styles from '../styles/GeopointInput.css'

class GeopointInput extends React.Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    title: PropTypes.string,
    description: PropTypes.string,
    value: PropTypes.shape({
      lat: PropTypes.number,
      lng: PropTypes.number
    }),
    field: PropTypes.shape({
      title: PropTypes.string.isRequired
    })
  };

  static contextTypes = {
    intl: intlShape
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
    const {value, field} = this.props

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
      <Fieldset legend={field.title} descriptions={field.description} className={styles.root}>
        {value && <div>
          <img className={styles.previewImage} src={this.getStaticImageUrl(value)} />
        </div>}

        <div className={styles.functions}>
          <Button onClick={this.handleToggleModal}>
            {formatMessage(value
              ? 'google-maps.button.edit'
              : 'google-maps.button.setLocation'
            )}
          </Button>

          {value && (
            <Button type="button">
              {formatMessage('google-maps.button.remove')}
            </Button>
          )}
        </div>

        {this.state.modalOpen && (
          <Dialog
            title={formatMessage('google-maps.placeOnMap')}
            onClose={this.handleCloseModal}
            onCloseClick={this.handleCloseModal}
            onOpen={this.handleOpenModal}
            message={formatMessage('google-maps.mapHelpText')}
            isOpen={this.state.modalOpen}
          >
            <GoogleMapsLoadProxy
              value={value}
              apiKey={config.apiKey}
              onChange={this.props.onChange}
              defaultLocation={config.defaultLocation}
              defaultZoom={config.defaultZoom}
              locale={this.context.intl.locale}
              component={GeopointSelect}
            />

          </Dialog>
        )}
      </Fieldset>
    )
  }
}

export default GeopointInput
