/**
 * This component is a fork of the `qrcode.react` package, original licensing can be found below.
 * \@license qrcode.react
 * Copyright (c) Paul O'Shannessy
 * SPDX-License-Identifier: ISC
 */

/* eslint-disable @typescript-eslint/no-shadow,no-eq-null,prefer-arrow-callback */

import {motion} from 'framer-motion'
import {memo, useMemo} from 'react'

import {Ecc, QrCode, QrSegment} from './qrcodegen'

type Modules = Array<Array<boolean>>
type Excavation = {x: number; y: number; w: number; h: number}
type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H'

type ERROR_LEVEL_MAPPED_TYPE = {
  [index in ErrorCorrectionLevel]: Ecc
}

const ERROR_LEVEL_MAP: ERROR_LEVEL_MAPPED_TYPE = {
  L: Ecc.LOW,
  M: Ecc.MEDIUM,
  Q: Ecc.QUARTILE,
  H: Ecc.HIGH,
} as const

type QRProps = {
  /**
   * The value to encode into the QR Code.
   */
  value: string
  /**
   * The size, in pixels, to render the QR Code.
   * @defaultValue 128
   */
  size?: number
  /**
   * The Error Correction Level to use.
   * @see https://www.qrcode.com/en/about/error_correction.html
   * @defaultValue L
   */
  level?: ErrorCorrectionLevel
  /**
   * @defaultValue #000000
   */
  color?: string
  /**
   * The title to assign to the QR Code. Used for accessibility reasons.
   */
  title?: string
  /**
   * The minimum version used when encoding the QR Code. Valid values are 1-40
   * with higher values resulting in more complex QR Codes. The optimal
   * (lowest) version is determined for the `value` provided, using `minVersion`
   * as the lower bound.
   * @defaultValue 1
   */
  minVersion?: number
  logoSize?: number
}

const DEFAULT_SIZE = 128
const DEFAULT_LEVEL: ErrorCorrectionLevel = 'L'
const DEFAULT_FGCOLOR = '#000000'
const DEFAULT_INCLUDEMARGIN = false
const DEFAULT_MINVERSION = 1

const SPEC_MARGIN_SIZE = 4
const DEFAULT_MARGIN_SIZE = 0

function generatePath(modules: Modules, margin: number = 0): string {
  const ops: Array<string> = []
  modules.forEach(function (row, y) {
    let start: number | null = null
    row.forEach(function (cell, x) {
      if (!cell && start !== null) {
        // M0 0h7v1H0z injects the space with the move and drops the comma,
        // saving a char per operation
        ops.push(`M${start + margin} ${y + margin}h${x - start}v1H${start + margin}z`)
        start = null
        return
      }

      // end of row, clean up or skip
      if (x === row.length - 1) {
        if (!cell) {
          // We would have closed the op above already so this can only mean
          // 2+ light modules in a row.
          return
        }
        if (start === null) {
          // Just a single dark module.
          ops.push(`M${x + margin},${y + margin} h1v1H${x + margin}z`)
        } else {
          // Otherwise finish the current line.
          ops.push(`M${start + margin},${y + margin} h${x + 1 - start}v1H${start + margin}z`)
        }
        return
      }

      if (cell && start === null) {
        start = x
      }
    })
  })
  return ops.join('')
}

// We could just do this in generatePath, except that we want to support
// non-Path2D canvas, so we need to keep it an explicit step.
function excavateModules(modules: Modules, excavation: Excavation): Modules {
  return modules.slice().map((row, y) => {
    if (y < excavation.y || y >= excavation.y + excavation.h) {
      return row
    }
    return row.map((cell, x) => {
      if (x < excavation.x || x >= excavation.x + excavation.w) {
        return cell
      }
      return false
    })
  })
}

function getImageSettings(
  cells: Modules,
  size: number,
  margin: number,
  logoSize?: number,
): null | {
  x: number
  y: number
  h: number
  w: number
  excavation: Excavation | null
} {
  if (!logoSize) {
    return null
  }
  const numCells = cells.length + margin * 2
  const scale = numCells / size
  const w = logoSize * scale
  const h = logoSize * scale
  const x = cells.length / 2 - w / 2
  const y = cells.length / 2 - h / 2

  const floorX = Math.floor(x)
  const floorY = Math.floor(y)
  const ceilW = Math.ceil(w + x - floorX)
  const ceilH = Math.ceil(h + y - floorY)
  const excavation = {x: floorX, y: floorY, w: ceilW, h: ceilH}

  return {x, y, h, w, excavation}
}

function getMarginSize(includeMargin: boolean, marginSize?: number): number {
  if (marginSize != null) {
    return Math.max(Math.floor(marginSize), 0)
  }
  return includeMargin ? SPEC_MARGIN_SIZE : DEFAULT_MARGIN_SIZE
}

function useQRCode({
  value,
  level,
  minVersion,
  includeMargin,
  marginSize,
  logoSize,
  size,
}: {
  value: string
  level: ErrorCorrectionLevel
  minVersion: number
  includeMargin: boolean
  marginSize?: number
  logoSize?: number
  size: number
}) {
  const qrcode = useMemo(() => {
    const segments = QrSegment.makeSegments(value)
    return QrCode.encodeSegments(segments, ERROR_LEVEL_MAP[level], minVersion)
  }, [value, level, minVersion])

  const {cells, margin, numCells, calculatedImageSettings} = useMemo(() => {
    const cells = qrcode.getModules()

    const margin = getMarginSize(includeMargin, marginSize)
    const numCells = cells.length + margin * 2
    const calculatedImageSettings = getImageSettings(cells, size, margin, logoSize)
    return {
      cells,
      margin,
      numCells,
      calculatedImageSettings,
    }
  }, [qrcode, size, logoSize, includeMargin, marginSize])

  return {
    qrcode,
    margin,
    cells,
    numCells,
    calculatedImageSettings,
  }
}

function QRCodeSVGComponent(props: QRProps) {
  const {
    value,
    size = DEFAULT_SIZE,
    level = DEFAULT_LEVEL,
    color = DEFAULT_FGCOLOR,
    minVersion = DEFAULT_MINVERSION,
    title,
    logoSize,
  } = props
  const marginSize: number | undefined = undefined

  const {margin, cells, numCells, calculatedImageSettings} = useQRCode({
    value,
    level,
    minVersion,
    includeMargin: DEFAULT_INCLUDEMARGIN,
    marginSize,
    logoSize,
    size,
  })

  const cellsToDraw = useMemo(
    () =>
      logoSize && calculatedImageSettings?.excavation
        ? excavateModules(cells, calculatedImageSettings.excavation)
        : cells,
    [calculatedImageSettings?.excavation, cells, logoSize],
  )

  // Drawing strategy: instead of a rect per module, we're going to create a
  // single path for the dark modules and layer that on top of a light rect,
  // for a total of 2 DOM nodes. We pay a bit more in string concat but that's
  // way faster than DOM ops.
  // For level 1, 441 nodes -> 2
  // For level 40, 31329 -> 2
  const fgPath = generatePath(cellsToDraw, margin)

  return (
    <svg height={size} width={size} viewBox={`0 0 ${numCells} ${numCells}`} role="img">
      {!!title && <title>{title}</title>}
      <motion.path
        fill={color}
        d={fgPath}
        shapeRendering="crispEdges"
        initial={{opacity: 0}}
        animate={{opacity: 2}}
        exit={{opacity: -1}}
      />
    </svg>
  )
}
const QRCodeSVG = memo(QRCodeSVGComponent)
QRCodeSVG.displayName = 'Memo(QRCodeSVG)'

export default QRCodeSVG
