import React, {forwardRef} from 'react'

// A slightly (arguably) more optically centered version of the current <CommentIcon> provided by @sanity/icons
// @todo: remove this and replace with an updated version from @sanity/icons

/**
 * @beta
 * @hidden
 */
export const CommentIcon = forwardRef(function Icon(
  props: React.SVGProps<SVGSVGElement>,
  ref: React.Ref<SVGSVGElement>,
) {
  return (
    <svg
      data-sanity-icon="comment"
      width="1em"
      height="1em"
      ref={ref}
      viewBox="0 0 25 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M7.5 15.5H9.5V19.5L13.5 15.5H17.5C18.6046 15.5 19.5 14.6046 19.5 13.5V7.5C19.5 6.39543 18.6046 5.5 17.5 5.5H7.5C6.39543 5.5 5.5 6.39543 5.5 7.5V13.5C5.5 14.6046 6.39543 15.5 7.5 15.5Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.2"
      />
    </svg>
  )
})
