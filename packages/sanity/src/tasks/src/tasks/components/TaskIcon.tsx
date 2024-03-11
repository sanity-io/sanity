// // @todo: remove this and replace when the icon is available in @sanity/icons
import {forwardRef} from 'react'

/**
 * @public
 */
export const TaskIcon = forwardRef(function TaskIcon(
  props: React.SVGProps<SVGSVGElement>,
  ref: React.Ref<SVGSVGElement>,
) {
  return (
    <svg
      data-sanity-icon="Task"
      width="1em"
      height="1em"
      viewBox="0 0 25 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      ref={ref}
      {...props}
    >
      <path
        d="M4.88281 10.75V19.75H20.8828V10.75M4.88281 10.75V5.75H20.8828V10.75M4.88281 10.75H12.8828H20.8828M17.8828 8.25V3.25M7.88281 8.25V3.25"
        stroke="currentColor"
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      <path
        d="M10.083 14.7358L12.083 16.7358L15.683 13.1758"
        stroke="currentColor"
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
    </svg>
  )
})
