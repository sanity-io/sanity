import React from 'react'
import imageUrlBuilder from '@sanity/image-url'
import sanityClient from 'part:@sanity/base/client'
import TrashIcon from 'part:@sanity/base/trash-icon'
import ImageIcon from 'part:@sanity/base/image-icon'
import styles from './ImagePreview.css'
import {ImagePreviewProps} from './types'
import {MetaInfo} from '../../../diff/components'

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
  const Icon = action === 'removed' ? TrashIcon : ImageIcon
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
      <MetaInfo title={title} icon={Icon}>
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
      </MetaInfo>
    </div>
  )
}
