import React from 'react'
import humanizeList from 'humanize-list'
import {FaFilm, FaYoutube, FaVimeo} from 'react-icons/fa'
import styles from './VideoEmbedPreview.module.css'

export interface VideoEmbedPreviewProps {
  value?: {
    service?:
      | 'youtube'
      | 'vimeo'
      | 'vine'
      | 'videopress'
      | 'microsoftstream'
      | 'tiktok'
      | 'dailymotion'
      | null
    id?: string
  }
}

export const SUPPORTED_SERVICES = [
  // .id in entries here must match the `service` id returned from from getVideoId,
  // see https://github.com/radiovisual/get-video-id
  {
    id: 'youtube',
    title: 'YouTube',
    url: (id: string) => `https://www.youtube.com/embed/${id}?rel=0`,
    icon: FaYoutube,
  },
  {
    id: 'vimeo',
    title: 'Vimeo',
    url: (id: string) => `https://player.vimeo.com/video/${id}`,
    icon: FaVimeo,
  },
]

export default function VideoEmbedPreview(props: VideoEmbedPreviewProps) {
  const {value} = props

  if (!value || !value.id) {
    return (
      <div className={styles.root}>
        <div />
        <FaFilm size={30} />
      </div>
    )
  }

  const service = value && SUPPORTED_SERVICES.find((s) => s.id === value.service)

  if (!service) {
    return (
      <div className={styles.root}>
        <div className={styles.unrecognizedService}>
          Unrecognized video service. Supported services are{' '}
          {humanizeList(SUPPORTED_SERVICES.map((s) => s.title))}
        </div>
      </div>
    )
  }

  const Icon = service.icon || FaFilm
  return (
    <div className={styles.root}>
      <iframe src={service.url(value.id)} frameBorder="0" allowFullScreen />
      <Icon size={30} />
    </div>
  )
}
