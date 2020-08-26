import * as React from 'react'
import styles from './SearchInput.css'

interface Props {
  api: typeof window.google.maps
  map: google.maps.Map
  onChange: (result: google.maps.places.PlaceResult) => void
}

export class SearchInput extends React.PureComponent<Props> {
  searchInputRef = React.createRef<HTMLInputElement>()
  autoComplete: google.maps.places.Autocomplete | undefined

  handleChange = () => {
    if (!this.autoComplete) {
      return
    }

    this.props.onChange(this.autoComplete.getPlace())

    if (this.searchInputRef.current) {
      this.searchInputRef.current.value = ''
    }
  }

  componentDidMount() {
    const input = this.searchInputRef.current
    if (!input) {
      return
    }

    const {api, map} = this.props
    const {Circle, places, event} = api
    const searchBounds = new Circle({center: map.getCenter(), radius: 100}).getBounds()
    this.autoComplete = new places.Autocomplete(input, {
      bounds: searchBounds,
      types: [] // return all kinds of places
    })

    event.addListener(this.autoComplete, 'place_changed', this.handleChange)
  }

  render() {
    return (
      <div className={styles.wrapper}>
        <input
          name="place"
          ref={this.searchInputRef}
          placeholder="Search for place or address"
          className={styles.input}
        />
      </div>
    )
  }
}
