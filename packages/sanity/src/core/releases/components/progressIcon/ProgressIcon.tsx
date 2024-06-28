import {type ForwardedRef, forwardRef, type SVGProps} from 'react'

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

const degreesToRadians = (degrees: number) => (degrees * Math.PI) / 180

type Props = {progress: number} & SVGProps<SVGSVGElement>

/**
 * @internal
 */
export const ProgressIcon = forwardRef(function ProgressCircleIcon(
  props: Props,
  ref: ForwardedRef<SVGSVGElement>,
) {
  const {progress, ...rest} = props

  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 25 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      ref={ref}
      {...rest}
    >
      <path
        d={`${partialCircle(
          12.5,
          12.5,
          4.5,
          degreesToRadians(-90),
          degreesToRadians(progress * 360 - 90),
        )
          .map((vs) => vs.join(' '))
          .join(' ')} L 12.5 12.5 Z`}
        fill="currentColor"
        stroke="currentColor"
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      <path
        d="M12.5 20.5C16.9183 20.5 20.5 16.9183 20.5 12.5C20.5 8.08172 16.9183 4.5 12.5 4.5C8.08172 4.5 4.5 8.08172 4.5 12.5C4.5 16.9183 8.08172 20.5 12.5 20.5Z"
        stroke="currentColor"
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
    </svg>
  )
})

/**
 * @internal
 */
export const ProgressHalfIcon = forwardRef(function ProgressHalfCircleIcon(
  props: Omit<Props, 'progress'>,
  ref: ForwardedRef<SVGSVGElement>,
) {
  return <ProgressIcon progress={0.5} {...props} ref={ref} />
})
