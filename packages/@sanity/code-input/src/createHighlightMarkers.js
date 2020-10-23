import styles from './HighlightMarkers.css'

export default function createHighlightMarkers(rows) {
  return rows.map((row) => ({
    startRow: Number(row) - 1,
    startCol: 0,
    endRow: Number(row) - 1,
    endCol: +Infinity,
    className: styles.highlight,
    type: 'background',
    inFront: true,
  }))
}
