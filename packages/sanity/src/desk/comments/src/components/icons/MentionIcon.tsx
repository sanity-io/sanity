import React, {forwardRef} from 'react'

/**
 * @beta
 * @hidden
 */
export const MentionIcon = forwardRef(function Icon(
  props: React.SVGProps<SVGSVGElement>,
  ref: React.Ref<SVGSVGElement>,
) {
  return (
    <svg
      data-sanity-icon="mention"
      fill="none"
      height="1em"
      ref={ref}
      viewBox="0 0 25 25"
      width="1em"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M16.6633 18.9383C15.539 19.6562 14.2034 20.0723 12.7705 20.0723C8.77022 20.0723 5.52734 16.8294 5.52734 12.8291C5.52734 8.82881 8.77022 5.58594 12.7705 5.58594C16.7708 5.58594 20.0137 8.82881 20.0137 12.8291C20.0137 13.6623 19.8249 14.7093 19.6141 15.2077C19.5578 15.3408 19.479 15.4845 19.3936 15.6238C19.0955 16.1106 18.5507 16.3721 17.9807 16.4018V16.4018C16.8271 16.462 15.8588 15.5428 15.8588 14.3877V9.27302"
        stroke="currentColor"
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      <circle cx="12.5732" cy="12.8291" r="3.08691" stroke="currentColor" strokeWidth={1.2} />
    </svg>
  )
})
