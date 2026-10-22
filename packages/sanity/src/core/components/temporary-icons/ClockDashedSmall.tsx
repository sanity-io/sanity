/* THIS FILE IS TEMPORARY - IMPORT FROM @SANITY/ICONS WHEN AVAILABLE */

import {type RefAttributes, type SVGProps} from 'react'

/**
 * The undecided release at the small size: ClockSmallIcon's geometry and weight (its ring is a 1.215 stroke on a 5.1 radius), with the face
 * dashed (8 even dashes) and the hands kept.
 *
 * @public
 */
export function ClockDashedSmallIcon(
  props: SVGProps<SVGSVGElement> & RefAttributes<SVGSVGElement>,
) {
  const {ref, ...rest} = props
  return (
    <svg
      data-sanity-icon="clock-dashed-small"
      width="1em"
      height="1em"
      viewBox="0 0 25 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      ref={ref}
      {...rest}
    >
      <circle
        cx="12.5"
        cy="12.5"
        r="5.1"
        pathLength={16}
        stroke="currentColor"
        strokeDasharray="1.2 0.8"
        strokeWidth={1.215}
      />
      <path
        d="M12.5 9.24V12.5L14.68 14.68"
        stroke="currentColor"
        strokeWidth={1.215}
        strokeLinejoin="round"
      />
    </svg>
  )
}
