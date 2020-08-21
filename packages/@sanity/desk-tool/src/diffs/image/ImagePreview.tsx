import React from 'react'
import imageUrlBuilder from '@sanity/image-url'
import sanityClient from 'part:@sanity/base/client'
import styles from './ImagePreview.css'
import {ImagePreviewProps} from './types'

const imageBuilder = imageUrlBuilder(sanityClient)

export default function ImagePreview({
  value,
  action = 'changed',
  hotspot,
  crop
}: ImagePreviewProps) {
  const title = value.originalFilename || 'Untitled'
  const dimensions = value?.metadata?.dimensions
  const imageSource = imageBuilder.image(value).height(300)
  return (
    <div className={styles.root}>
      <div className={styles.imageWrapper}>
        <img
          className={styles.image}
          src={imageSource.url() || ''}
          alt={title}
          data-action={action}
        />
      </div>
      <div className={styles.meta} data-action={action}>
        <div className={styles.info}>
          <h3 className={styles.title} title={title}>
            {title}
          </h3>
          {dimensions && action !== 'changed' && (
            <div>
              {['added', 'removed'].includes(action)
                ? action
                : `${dimensions.height}x${dimensions.width}`}
            </div>
          )}
          {action === 'changed' && (
            <div>
              <span>{action} hotspot/crop</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
