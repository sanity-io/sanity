// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import React from 'react'
import classNames from 'classnames'
import {Grid, Button, Dialog} from '@sanity/ui'
import {Path, Marker} from '@sanity/types'
import config from 'config:@sanity/google-maps-input'
import Fieldset from 'part:@sanity/components/fieldsets/default'
import {PatchEvent, set, setIfMissing, unset} from 'part:@sanity/form-builder/patch-event'
import EditIcon from 'part:@sanity/base/edit-icon'
import TrashIcon from 'part:@sanity/base/trash-icon'
import {ChangeIndicatorCompareValueProvider, ChangeIndicator} from '@sanity/base/change-indicators'
import {GoogleMapsLoadProxy} from '../loader/GoogleMapsLoadProxy'
import {Geopoint, GeopointSchemaType} from '../types'
import {GeopointSelect} from './GeopointSelect'
import styles from './GeopointInput.css'

const getStaticImageUrl = (value) => {
  const loc = `${value.lat},${value.lng}`
  const params = {
    key: config.apiKey,
    center: loc,
    markers: loc,
    zoom: 13,
    scale: 2,
    size: '640x300',
  }

  const qs = Object.keys(params).reduce((res, param) => {
    return res.concat(`${param}=${encodeURIComponent(params[param])}`)
  }, [] as string[])

  return `https://maps.googleapis.com/maps/api/staticmap?${qs.join('&')}`
}

interface InputProps {
  markers: Marker[]
  level?: number
  value?: Geopoint
  compareValue?: Geopoint
  type: GeopointSchemaType
  readOnly?: boolean
  onFocus: (path: Path) => void
  onBlur: () => void
  onChange: (patchEvent: unknown) => void
  presence: unknown[]
}

// @todo
// interface Focusable {
//   focus: () => void
// }
type Focusable = any

interface InputState {
  modalOpen: boolean
  hasFocus: boolean
}

class GeopointInput extends React.PureComponent<InputProps, InputState> {
  static defaultProps = {
    markers: [],
  }

  editButton: Focusable | undefined

  constructor(props) {
    super(props)

    this.state = {
      modalOpen: false,
      hasFocus: false,
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

  handleFocus = (event) => {
    this.setState({hasFocus: true})
    this.props.onFocus(event)
  }

  handleBlur = () => {
    this.setState({hasFocus: false})
    this.props.onBlur()
  }

  handleToggleModal = () => {
    const {onFocus, onBlur} = this.props
    this.setState(
      (prevState) => ({modalOpen: !prevState.modalOpen}),
      () => {
        if (this.state.modalOpen) {
          onFocus(['$'])
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
          _type: type.name,
        }),
        set(latLng.lat(), ['lat']),
        set(latLng.lng(), ['lng']),
      ])
    )
  }

  handleClear = () => {
    const {onChange} = this.props
    onChange(PatchEvent.from(unset()))
  }

  render() {
    const {value, compareValue, readOnly, type, markers, level, presence} = this.props
    const {modalOpen, hasFocus} = this.state

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
      <Fieldset
        level={level}
        legend={type.title}
        description={type.description}
        markers={markers}
        presence={presence}
        onFocus={this.handleFocus}
        onBlur={this.handleBlur}
        changeIndicator={false}
      >
        <div>
          {value && (
            <ChangeIndicatorCompareValueProvider value={value} compareValue={compareValue}>
              <ChangeIndicator
                className={classNames(
                  styles.map,
                  readOnly && styles.readOnly,
                  hasFocus && styles.focused
                )}
                compareDeep
              >
                <img
                  className={styles.previewImage}
                  src={getStaticImageUrl(value)}
                  alt="Map location"
                />
              </ChangeIndicator>
            </ChangeIndicatorCompareValueProvider>
          )}

          {!readOnly && (
            <div className={styles.functions}>
              <Grid columns={2} gap={2}>
                <Button
                  mode="ghost"
                  icon={value && EditIcon}
                  ref={this.setEditButton}
                  text={value ? 'Edit' : 'Set location'}
                  onClick={this.handleToggleModal}
                />

                {value && (
                  <Button
                    tone="critical"
                    icon={TrashIcon}
                    mode="ghost"
                    text={'Remove'}
                    onClick={this.handleClear}
                  />
                )}
              </Grid>
            </div>
          )}

          {modalOpen && (
            <Dialog
              id="geo"
              title="Place the marker on the map"
              onClose={this.handleCloseModal}
              header="Place the marker on the map"
              width={1}
            >
              <div className={styles.dialogInner}>
                <GoogleMapsLoadProxy>
                  {(api) => (
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
        </div>
      </Fieldset>
    )
  }
}

export default GeopointInput
