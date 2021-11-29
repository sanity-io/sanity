import type {Marker} from 'react-ace'
import {css} from 'styled-components'

export const highlightMarkersCSS = css`
  .ace_editor_markers_highlight {
    position: absolute;
    background-color: ${({theme}) => theme.sanity.color.solid.primary.enabled.bg};
    opacity: 0.2;
    width: 100% !important;
    border-radius: 0 !important;
  }
`

export default function createHighlightMarkers(rows: number[]): Marker[] {
  return rows.map((row) => ({
    startRow: Number(row) - 1,
    startCol: 0,
    endRow: Number(row) - 1,
    endCol: +Infinity,
    className: 'ace_editor_markers_highlight',
    type: 'highlight',
    inFront: true,
  }))
}
