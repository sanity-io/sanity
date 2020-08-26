import React from 'react'
import config from 'config:@sanity/google-maps-input'
import Button from 'part:@sanity/components/buttons/default'
import Dialog from 'part:@sanity/components/dialogs/default'
import FormField from 'part:@sanity/components/formfields/default'
import {PatchEvent, set, setIfMissing, unset} from 'part:@sanity/form-builder/patch-event'
import ButtonGrid from 'part:@sanity/components/buttons/button-grid'
import EditIcon from 'part:@sanity/base/edit-icon'
import TrashIcon from 'part:@sanity/base/trash-icon'
import {GoogleMapsLoadProxy} from '../loader/GoogleMapsLoadProxy'
import {Geopoint, GeopointSchemaType} from '../types'
import {GeopointSelect} from './GeopointSelect'
import styles from './GeopointInput.css'

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
  }, [] as string[])

  return `https://maps.googleapis.com/maps/api/staticmap?${qs.join('&')}`
}

interface InputProps {
  markers: unknown[]
  level?: number
  value?: Geopoint
  type: GeopointSchemaType
  readOnly?: boolean
  onFocus: (path: unknown[]) => void
  onBlur: () => void
  onChange: (patchEvent: unknown) => void
}

interface Focusable {
  focus: () => void
}

interface InputState {
  modalOpen: boolean
}

class GeopointInput extends React.PureComponent<InputProps, InputState> {
  static defaultProps = {
    markers: []
  }

  editButton: Focusable | undefined

  constructor(props) {
    super(props)

    this.state = {
      modalOpen: false
    }
  }

  setEditButton = (el: Focusable) => {
    this.editButton = el
  }

  focus() {
    if (this.editButton) {
      this.editButton.focus()
    }
  }

  handleToggleModal = () => {
    const {onFocus, onBlur} = this.props
    this.setState(
      prevState => ({modalOpen: !prevState.modalOpen}),
      () => {
        if (this.state.modalOpen) {
          onFocus([])
        } else {
          onBlur()
        }
      }
    )
  }

  handleCloseModal = () => {
    this.setState({modalOpen: false})
  }

  handleChange = (latLng: google.maps.LatLng) => {
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

  render() {
    const {value, readOnly, type, markers, level, onFocus, onBlur} = this.props
    const {modalOpen} = this.state

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
            <code style={{whiteSpace: 'nowrap'}}>
              `&lt;project-root&gt;/config/@sanity/google-maps-input.json`
            </code>
          </p>
        </div>
      )
    }

    return (
      <FormField
        markers={markers}
        level={level}
        label={type.title}
        description={type.description}
        className={styles.root}
        onFocus={onFocus}
        onBlur={onBlur}
      >
        <>
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
              <Button
                inverted
                onClick={this.handleToggleModal}
                icon={value && EditIcon}
                ref={this.setEditButton}
              >
                {value ? 'Edit' : 'Set location'}
              </Button>

              {value && (
                <Button color="danger" icon={TrashIcon} inverted onClick={this.handleClear}>
                  Remove
                </Button>
              )}
            </ButtonGrid>
          </div>

          {modalOpen && (
            <Dialog
              title="Place on map"
              onClose={this.handleCloseModal}
              onCloseClick={this.handleCloseModal}
              message="Select location by dragging the marker or search for a place"
              isOpen={modalOpen}
            >
              <div className={styles.dialogInner}>
                <GoogleMapsLoadProxy>
                  {api => (
                    <GeopointSelect
                      api={api}
                      value={value}
                      onChange={readOnly ? undefined : this.handleChange}
                      defaultLocation={config.defaultLocation}
                      defaultZoom={config.defaultZoom}
                    />
                  )}
                </GoogleMapsLoadProxy>
              </div>
            </Dialog>
          )}
        </>
      </FormField>
    )
  }
}

export default GeopointInput
