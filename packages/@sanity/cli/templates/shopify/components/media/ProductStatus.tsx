import {CloseIcon, ImageIcon, LinkRemovedIcon} from '@sanity/icons'
import React, {forwardRef, useState} from 'react'

type Props = {
  isActive: boolean
  isDeleted: boolean
  type: 'product' | 'productVariant'
  url: string
}

const ProductMediaPreview = forwardRef<HTMLDivElement, Props>((props, ref) => {
  const {isActive, isDeleted, type, url} = props

  const [imageVisible, setImageVisible] = useState(true)

  // Hide image on error / 404
  const handleImageError = () => setImageVisible(false)

  return (
    <div
      ref={ref}
      style={{
        alignItems: 'center',
        display: 'flex',
        height: '5em',
        justifyContent: 'center',
        position: 'relative',
        width: '5em',
      }}
    >
      {imageVisible && url ? (
        <img
          onError={handleImageError}
          src={`${url}&width=400`}
          style={{
            height: '100%',
            left: 0,
            objectFit: 'contain',
            position: 'absolute',
            top: 0,
            width: '100%',
          }}
        />
      ) : (
        <ImageIcon
          style={{
            height: '100%',
            position: 'absolute',
            width: '100%',
          }}
        />
      )}

      {/* Item has been deleted */}
      {isDeleted ? (
        <CloseIcon
          style={{
            background: 'rgba(255, 0, 0, 0.7)',
            color: 'rgba(255, 255, 255, 0.85)',
            height: '100%',
            position: 'relative',
            width: '100%',
          }}
        />
      ) : (
        <>
          {/* Products only: item is no longer active */}
          {type === 'product' && !isActive && (
            <LinkRemovedIcon
              style={{
                background: 'rgba(0, 0, 0, 0.7)',
                color: 'rgba(255, 255, 255, 0.85)',
                height: '100%',
                position: 'relative',
                width: '100%',
              }}
            />
          )}
        </>
      )}
    </div>
  )
})

export default ProductMediaPreview
