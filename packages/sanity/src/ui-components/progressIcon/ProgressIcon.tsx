const degreesToRadians = (degrees: number) => (degrees * Math.PI) / 180

/**
 * This is a component that renders a progress icon based on the progress percentage
 * @param progress - The progress percentage (0-100)
 * @returns The progress icon based on the progress percentage
 */
export function ProgressIcon(props: {progress: number}) {
  const {progress, ...rest} = props

  const circlePath = partialCircle(
    12.5,
    12.5,
    4.5,
    degreesToRadians(-90),
    degreesToRadians(progress * 360 - 90),
  )

  const d =
    circlePath.length > 0
      ? `${circlePath.map((vs) => vs.join(' ')).join(' ')} L 12.5 12.5 Z`
      : undefined

  return (
    <svg
      data-sanity-icon="progress-50"
      width="1em"
      height="1em"
      viewBox="0 0 25 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      {d && (
        <path
          d={d}
          fill="currentColor"
          stroke="currentColor"
          strokeWidth={1.2}
          strokeLinejoin="round"
        />
      )}
      <path
        d="M12.5 20.5C16.9183 20.5 20.5 16.9183 20.5 12.5C20.5 8.08172 16.9183 4.5 12.5 4.5C8.08172 4.5 4.5 8.08172 4.5 12.5C4.5 16.9183 8.08172 20.5 12.5 20.5Z"
        stroke="currentColor"
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
    </svg>
  )
}

function partialCircle(cx: number, cy: number, r: number, start: number, end: number) {
  const length = end - start
  if (length === 0) return []

  const fromX = r * Math.cos(start) + cx
  const fromY = r * Math.sin(start) + cy
  const toX = r * Math.cos(end) + cx
  const toY = r * Math.sin(end) + cy
  const large = Math.abs(length) <= Math.PI ? '0' : '1'
  const sweep = length < 0 ? '0' : '1'

  return [
    ['M', fromX, fromY],
    ['A', r, r, 0, large, sweep, toX, toY],
  ]
}
