import React, {PropTypes} from 'react'

import styles from 'part:@sanity/components/imageinput/fieldset-style'
import ProgressCircle from 'part:@sanity/components/progress/circle'
import UploadIcon from 'part:@sanity/base/upload-icon'
import Fieldset from 'part:@sanity/components/fieldsets/default'
import ImageLoader from 'part:@sanity/components/utilities/image-loader'
import HotspotImage from '@sanity/imagetool/HotspotImage'
import ImageSelect from 'part:@sanity/components/imageinput/image-select'
import {DEFAULT_CROP} from '@sanity/imagetool/constants'
import TrashIcon from 'part:@sanity/base/trash-icon'
import EditIcon from 'part:@sanity/base/edit-icon'
import Button from 'part:@sanity/components/buttons/default'

const DEFAULT_HOTSPOT = {
  height: 1,
  width: 1,
  x: 0.5,
  y: 0.5
}

export default class ImageInputFieldset extends React.PureComponent {
  static propTypes = {
    status: PropTypes.oneOf(['ready', 'complete', 'pending', 'error']),
    legend: PropTypes.string,
    level: PropTypes.number,
    percent: PropTypes.number,
    fieldName: PropTypes.string,
    onSelect: PropTypes.func,
    onCancel: PropTypes.func,
    onClear: PropTypes.func,
    onEdit: PropTypes.func,
    hotspotImage: PropTypes.shape({
      hotspot: PropTypes.object,
      crop: PropTypes.object,
      imageUrl: PropTypes.string
    }),
    children: PropTypes.node,
    showContent: PropTypes.bool,
    multiple: PropTypes.bool,
    accept: PropTypes.string
  }

  static defaultProps = {
    level: 0,
    status: 'ready',
    showContent: true
  }

  constructor(...args) {
    super(...args)
    this.state = {
      aspect: null
    }
  }

  render() {
    const {legend, level, hotspotImage, fieldName, percent, status, onCancel, onEdit, children} = this.props
    let {showContent} = this.props

    if (!children) {
      showContent = false
    }

    return (
      <Fieldset legend={legend} level={level} className={`${styles[`level${level}`]}`}>
        <div className={`${styles.grid} ${showContent ? styles.hasContent : styles.noContent}`}>
          <div
            className={`
              ${hotspotImage && hotspotImage.imageUrl ? styles.imageWrapper : styles.imageWrapperEmpty}
              ${status == 'error' ? styles.error : ''}
            `}
          >
            {
              (status != 'error' && status != 'pending') && hotspotImage && hotspotImage.imageUrl && (
                <div className={styles.ghost}>
                  <ImageSelect
                    className={styles.imageSelect}
                    name={fieldName}
                    onSelect={this.props.onSelect}
                    dropzone
                    multiple={this.props.multiple}
                    accept={this.props.accept}
                    ghost
                  />
                </div>
              )
            }
            {
              ((hotspotImage && hotspotImage.imageUrl))
              && <div className={status === 'complete' || status === 'ready' ? styles.imageIsUploaded : styles.imageIsNotUploaded}>
                {
                  hotspotImage && (
                    <ImageLoader src={hotspotImage.imageUrl}>
                      {({image, error}) => {
                        return (
                          <HotspotImage
                            aspectRatio="auto"
                            src={image.src}
                            srcAspectRatio={image.width / image.height}
                            hotspot={hotspotImage.hotspot || DEFAULT_HOTSPOT}
                            crop={hotspotImage.crop || DEFAULT_CROP}
                          />
                        )
                      }}
                    </ImageLoader>
                  )
                }
              </div>
            }

            {
              // Empty state and ready
              status === 'ready'
              && !(hotspotImage && hotspotImage.imageUrl)
              && (
                <ImageSelect
                  className={styles.imageSelect}
                  name={fieldName}
                  onSelect={this.props.onSelect}
                  dropzone
                  multiple={this.props.multiple}
                  accept={this.props.accept}
                />
              )
            }
            {
              status !== 'complete' && status !== 'ready'
              && <div className={styles.progressContainer}>
                <div className={styles.progressInner}>
                  {percent && <ProgressCircle percent={percent} showPercent className={styles.progress} />}
                </div>
              </div>
            }
            {
              status === 'pending' && onCancel
              && <a className={styles.cancel} onClick={this.props.onCancel}>Cancel</a>
            }
            {
              status == 'error'
              && <div className={styles.errorMessage}>
                <div>Error!</div>
                <ImageSelect name={fieldName} onSelect={this.props.onSelect}>
                  <span>Try again…</span>
                </ImageSelect>
              </div>
            }

            {
              status === 'complete'
              && <div className={styles.progressContainerComplete}>
                <div className={styles.progressInner}>
                  <ProgressCircle percent={100} completed className={styles.progressComplete} />
                </div>
              </div>
            }

            {
              (status != 'error' && status != 'pending') && hotspotImage && hotspotImage.imageUrl && (
                <div className={styles.functions}>
                  <Button icon={UploadIcon} ripple={false} className={styles.replaceImageButton} title="Replace image">
                    {
                      showContent ? '' : 'Replace'
                    }
                    <ImageSelect name={fieldName} onSelect={this.props.onSelect} className={styles.replaceImageSelect} />
                  </Button>
                  {
                    onEdit && (
                      <Button icon={EditIcon} className={styles.replaceImageButton} title="Edit image" onClick={onEdit}>
                        {
                          !showContent && 'Edit'
                        }
                      </Button>
                    )
                  }
                  <Button
                    className={styles.removeButton}
                    onClick={this.props.onClear}
                    icon={TrashIcon}
                    color="danger"
                    title="Remove image"
                  >
                    {
                      !showContent && 'Remove'
                    }
                  </Button>
                </div>
              )
            }
          </div>
          {
            children && (
              <div className={showContent ? styles.content : styles.contentAbsolute}>
                {children}
              </div>
            )
          }
        </div>
      </Fieldset>
    )
  }
}
