import React, {forwardRef} from 'react'

/**
 * @beta
 * @hidden
 */
export const AddCommentIcon = forwardRef(function Icon(
  props: React.SVGProps<SVGSVGElement>,
  ref: React.Ref<SVGSVGElement>,
) {
  return (
    <svg
      data-sanity-icon="add-comment"
      fill="none"
      height="1em"
      ref={ref}
      viewBox="0 0 25 25"
      width="1em"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M12.3368 5.97917H6.89453C5.78996 5.97917 4.89453 6.8746 4.89453 7.97917V13.4881C4.89453 14.5926 5.78996 15.4881 6.89453 15.4881H8.69808V19.2916L12.5016 15.4881H16.207C17.3115 15.4881 18.207 14.5926 18.207 13.4881V11.7158"
        stroke="currentColor"
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      <path
        d="M18.2081 2.08333V9.87058M14.3145 5.97695H22.1017"
        stroke="currentColor"
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
    </svg>
  )
})
