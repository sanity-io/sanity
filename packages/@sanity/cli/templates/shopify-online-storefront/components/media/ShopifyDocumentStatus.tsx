import React from 'react'
import {CloseIcon, ImageIcon, LinkRemovedIcon} from '@sanity/icons'
import {forwardRef, useState} from 'react'

type Props = {
  isActive?: boolean
  isDeleted: boolean
  type: 'collection' | 'product' | 'productVariant'
  url: string
  title: string
}

const ShopifyDocumentStatus = forwardRef<HTMLDivElement, Props>((props, ref) => {
  const {isActive, isDeleted, title, type, url} = props

  const [imageVisible, setImageVisible] = useState(true)

  // Hide image on error / 404
  const handleImageError = () => setImageVisible(false)

  return (
    <div
      ref={ref}
      style={{
        alignItems: 'center',
        borderRadius: 'inherit',
        display: 'flex',
        height: '100%',
        justifyContent: 'center',
        overflow: 'hidden',
        width: '100%',
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
          alt={`${title} preview`}
        />
      ) : (
        <ImageIcon style={{position: 'absolute'}} />
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

export default ShopifyDocumentStatus
