import React from 'react'
import styles from './ConnectorsOverlay.css'
import {connectorLinePath, linePathFromPoints} from '../../components/changeConnector/svgHelpers'
import {Arrows} from '../../components/changeConnector/Arrows'
import * as PathUtils from '@sanity/util/paths'
import {groupBy} from 'lodash'

interface Props {
  children?: React.ReactNode
  trackerRef: React.RefObject<HTMLDivElement>
  regions: any[]
}

const DEBUG = false

export function ConnectorsOverlay(props: Props) {
  const {children, trackerRef, regions, ...rest} = props

  const grouped = groupBy(regions, region => {
    if (region.id === 'changesPanel') {
      return 'changesPanel'
    }
    return region.id.startsWith('field-') ? 'fieldRegions' : 'changeRegions'
  })

  const changesPanel = grouped.changesPanel && grouped.changesPanel[0]
  // note: this assumes the changes panel header and the document panel always have the same height
  const topEdge = changesPanel?.rect?.top

  const {fieldRegions = [], changeRegions = []} = grouped
  return (
    <div ref={trackerRef} {...rest}>
      {children}
      {changesPanel &&
        fieldRegions
          .filter(r => r.data)
          .map(changedField => {
            const changedRegion = changeRegions.find(r =>
              PathUtils.isEqual(r.data.path, changedField.data.path)
            )
            if (!changedRegion) {
              return null
            }
            const changeMarkerLeft = changedRegion?.rect?.left
            const connectorFrom = {
              left: changedField.rect.left + changedField.rect.width,
              top: changedField.rect.top - topEdge + 8
            }
            const connectorTo = {
              left: changeMarkerLeft,
              top: changedRegion.rect.top - topEdge + 8
            }

            const connectorPath = connectorLinePath(
              connectorFrom,
              connectorTo,
              10,
              changesPanel.rect.left + 10
            )
            return (
              <svg
                key={changedField.id}
                onClick={() => {
                  if (changedField?.data) changedField?.data.scrollTo()
                  if (changedRegion?.data) changedRegion?.data.scrollTo()
                }}
                className={styles.svg}
                style={{
                  pointerEvents: 'none',
                  position: 'absolute',
                  ...(DEBUG ? {backgroundColor: 'rgba(0, 100, 100, 0.2)'} : {}),
                  top: changesPanel.rect.top,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: changesPanel.rect.height,
                  width: '100%'
                }}
              >
                <React.Fragment key={`field-${changedField.id}`}>
                  {changedRegion && (
                    <g className={styles.connector}>
                      <g
                        className={`${styles.connectorPath}${
                          changedField.data.hasFocus ? styles.hasFocus : ''
                        }`}
                      >
                        <path d={connectorPath} fill="none" />
                        {/* to make the active area wider */}
                        <path d={connectorPath} strokeWidth={15} stroke="none" fill="none" />
                        <Arrows
                          from={connectorFrom}
                          to={connectorTo}
                          left={changesPanel.rect.left + 10}
                          bounds={{
                            width: 0,
                            height: changesPanel.rect.height
                          }}
                        />
                      </g>
                    </g>
                  )}
                </React.Fragment>
              </svg>
            )
          })}
    </div>
  )
}
