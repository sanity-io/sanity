import React, {PropTypes} from 'react'
import config from 'config:@sanity/google-maps-input'
import GoogleMapsLoadProxy from './GoogleMapsLoadProxy'
import GeopointSelect from './GeopointSelect'
import {intlShape} from 'component:@sanity/base/locale/intl'
import {formatMessage} from 'role:@sanity/base/locale/formatters'
//import Fieldset from 'component:@sanity/components/fieldsets/default'
import Button from 'component:@sanity/components/buttons/default'
import Dialog from 'component:@sanity/components/dialogs/default'

class GeopointInput extends React.Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    title: PropTypes.string,
    description: PropTypes.string,
    value: PropTypes.shape({
      lat: PropTypes.number,
      lng: PropTypes.number
    })
  };

  static contextTypes = {
    intl: intlShape
  };

  constructor() {
    super()

    this.handleToggleModal = this.handleToggleModal.bind(this)
    this.handleDialogAction = this.handleDialogAction.bind(this)

    this.state = {
      dragMarkerInitialPosition: null,
      modalOpen: false
    }
  }

  handleToggleModal() {
    this.setState({modalOpen: !this.state.modalOpen})
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

  handleDialogAction(action) {
    console.log('we have action', action)
  }


  render() {
    const {value} = this.props

    const actions = [
      {
        title: 'Bjørge',
        id: 'b'
      }
    ]

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
      <div>
        {value && <div><img src={this.getStaticImageUrl(value)} /></div>}

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

        <div
          title={formatMessage('google-maps.placeOnMap')}
          onClose={this.handleToggleModal}
          message={formatMessage('google-maps.mapHelpText')}
          isOpen={this.state.modalOpen}
          actions={actions}
          onAction={this.handleDialogAction}
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

      </div>

      </div>
    )
  }
}

export default GeopointInput
