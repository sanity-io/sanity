import React from 'react'

interface SvgPlaceHolderProps {
  styles: Record<string, string>
}

const svgStyles: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  height: '100%'
}

const SvgPlaceholder = ({styles}: SvgPlaceHolderProps) => {
  return (
    <div className={styles.placeholder}>
      <svg x="0" y="0" className={styles.svg} style={svgStyles}>
        <linearGradient
          id="loader_gradient"
          gradientUnits="userSpaceOnUse"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0" style={{stopColor: 'currentColor'}} stopOpacity="0.2" />
          <stop offset="0.5" style={{stopColor: 'currentColor'}} stopOpacity="0.3" />
          <stop offset="1" style={{stopColor: 'currentColor'}} stopOpacity="0.2" />
          {/*
            Animation disabled due to performance issues. Do not re-enable before verifying that it doesn't cause
            performance degradations having a *lot* of placeholders on the page /BN
          */}
          {/*<animate attributeName="x1" dur="700ms" from="-100" to="100%" repeatCount="indefinite" />*/}
          {/*<animate attributeName="y1" dur="700ms" from="-100" to="100%" repeatCount="indefinite" />*/}
          {/*<animate attributeName="x2" dur="700ms" from="0%" to="200%" repeatCount="indefinite" />*/}
          {/*<animate attributeName="y2" dur="700ms" from="0%" to="200%" repeatCount="indefinite" />*/}
        </linearGradient>
        <g fill="url(#loader_gradient)" className={styles.placeholderG}>
          <rect className={styles.media} />
          <rect className={styles.date} width="80%" />
          <rect className={styles.title} width="80%" />
          <rect className={styles.subtitle} width="50%" />
          <rect className={styles.description_1} width="100%" />
          <rect className={styles.description_2} width="50%" />
        </g>
      </svg>
    </div>
  )
}

export default SvgPlaceholder
