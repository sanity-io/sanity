/* eslint-disable react/no-multi-comp, react/display-name */
import React from 'react'
import humanizeList from 'humanize-list'
import PropTypes from 'prop-types'
import FaFilm from 'react-icons/lib/fa/film'
import FaYouTube from 'react-icons/lib/fa/youtube'
import FaVimeo from 'react-icons/lib/fa/vimeo'
import styles from './VideoEmbedPreview.css'

export const SUPPORTED_SERVICES = [
  // .id in entries here must match the `service` id returned from from getVideoId,
  // see https://github.com/radiovisual/get-video-id
  {
    id: 'youtube',
    title: 'YouTube',
    url: id => `https://www.youtube.com/embed/${id}?rel=0`,
    icon: FaYouTube
  },
  {
    id: 'vimeo',
    title: 'Vimeo',
    url: id => `https://player.vimeo.com/video/${id}`,
    icon: FaVimeo
  }
]

export default class VideoEmbedPreview extends React.Component {
  static propTypes = {
    value: PropTypes.shape({
      service: PropTypes.string,
      id: PropTypes.string
    })
  }

  render() {
    const {value} = this.props

    if (!value || !value.id) {
      return (
        <div className={styles.root}>
          <div />
          <FaFilm size={30} />
        </div>
      )
    }

    const service = value && SUPPORTED_SERVICES.find(s => s.id === value.service)

    if (!service) {
      return (
        <div className={styles.root}>
          <div className={styles.unrecognizedService}>
            Unrecognized video service. Supported services
            are {humanizeList(SUPPORTED_SERVICES.map(s => s.title))}
          </div>
        </div>
      )
    }

    const Icon = service.icon || FaFilm
    return (
      <div className={styles.root}>
        <iframe
          src={service.url(value.id)}
          frameBorder="0"
          allowFullScreen
        />
        <Icon size={30} />
      </div>
    )
  }
}
