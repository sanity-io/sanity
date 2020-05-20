/* eslint-disable react/no-multi-comp */
import React from 'react'
import PropTypes from 'prop-types'
import config from 'config:sanity'
import BrandLogo from 'part:@sanity/base/brand-logo?'
import styles from './styles/LoginDialogContent.css'

const projectName = (config.project && config.project.name) || ''

/* eslint-disable max-len */
const GithubLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 438.55 438.55">
    <path d="M409.13 114.57a218.32 218.32 0 0 0-79.8-79.8Q278.94 5.36 219.27 5.36T109.21 34.77a218.29 218.29 0 0 0-79.8 79.8Q0 165 0 224.63q0 71.67 41.83 128.91t108.06 79.23q7.71 1.43 11.42-2a11.17 11.17 0 0 0 3.69-8.57q0-.86-.14-15.42t-.14-25.41l-6.57 1.14a83.77 83.77 0 0 1-15.85 1 120.73 120.73 0 0 1-19.84-2 44.34 44.34 0 0 1-19.11-8.51 36.23 36.23 0 0 1-12.56-17.6l-2.86-6.57a71.34 71.34 0 0 0-9-14.56q-6.14-8-12.42-10.85l-2-1.43a21 21 0 0 1-3.71-3.43 15.66 15.66 0 0 1-2.57-4q-.86-2 1.43-3.29C61.2 310.42 64 310 68 310l5.71.85q5.71 1.14 14.13 6.85a46.08 46.08 0 0 1 13.85 14.84q6.57 11.71 15.85 17.85t18.7 6.14a81.19 81.19 0 0 0 16.27-1.42 56.78 56.78 0 0 0 12.85-4.29q2.57-19.14 14-29.41a195.49 195.49 0 0 1-29.36-5.13 116.52 116.52 0 0 1-26.83-11.14 76.86 76.86 0 0 1-23-19.13q-9.14-11.42-15-30t-5.8-42.81q0-34.55 22.56-58.82-10.57-26 2-58.24 8.28-2.57 24.55 3.85t23.84 11q7.57 4.56 12.13 7.71a206.2 206.2 0 0 1 109.64 0l10.85-6.85a153.65 153.65 0 0 1 26.26-12.56q15.13-5.71 23.13-3.14 12.84 32.26 2.28 58.24 22.55 24.27 22.56 58.82 0 24.27-5.85 43t-15.12 30a79.82 79.82 0 0 1-23.13 19 116.74 116.74 0 0 1-26.84 11.14 195.29 195.29 0 0 1-29.23 5.07q14.8 12.84 14.81 40.58v60.2a11.37 11.37 0 0 0 3.57 8.56q3.57 3.42 11.28 2 66.24-22 108.07-79.23t41.83-128.91q-.03-59.62-29.43-110.05z" />
  </svg>
)

const GoogleLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
    <path
      d="M11 24a13 13 0 0 1 .66-4.08l-7.4-5.66a22.18 22.18 0 0 0 0 19.49l7.4-5.67A13 13 0 0 1 11 24z"
      fill="#fbbc05"
    />
    <path
      d="M24 11a12.72 12.72 0 0 1 8.1 2.9l6.4-6.4a22 22 0 0 0-34.24 6.75l7.4 5.66A13 13 0 0 1 24 11z"
      fill="#ea4335"
    />
    <path
      d="M24 37a13 13 0 0 1-12.34-8.92l-7.4 5.66A21.93 21.93 0 0 0 24 46a21 21 0 0 0 14.33-5.48l-7-5.44A13.59 13.59 0 0 1 24 37zm-12.35-8.93l-7.4 5.67 7.4-5.66z"
      fill="#34a853"
    />
    <path
      d="M44.5 20H24v8.5h11.8a9.91 9.91 0 0 1-4.49 6.58l7 5.44C42.37 36.76 45 31.17 45 24a18.25 18.25 0 0 0-.5-4z"
      fill="#4285f4"
    />
  </svg>
)

const QuestionmarkLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 112 112">
    <path d="M0 0h112v112H0z" />
    <circle cx="56" cy="56" r="56" fill="#AFBACA" />
    <path d="M22 24h68v68H22z" />
    <path d="M27.667 35.333h56.667v45.333H27.667z" />
    <path
      fill="#fff"
      d="M84.333 41c0-3.117-2.55-5.667-5.666-5.667H33.333c-3.116 0-5.666 2.55-5.666 5.667v34c0 3.117 2.55 5.667 5.666 5.667h45.334c3.116 0 5.666-2.55 5.666-5.667V41zm-5.666 0L56 55.167 33.333 41h45.334zm0 34H33.333V46.667L56 60.833l22.667-14.166V75z"
    />
  </svg>
)
/* eslint-enable max-len */

function getProviderLogo(provider) {
  switch (provider.name) {
    case 'google':
      return GoogleLogo
    case 'github':
      return GithubLogo
    default:
      return function CustomLogo() {
        return provider.logo ? (
          <img src={provider.logo} alt={`Logo for ${provider.name}`} />
        ) : (
          <QuestionmarkLogo />
        )
      }
  }
}

// eslint-disable-next-line react/require-optimization
export default class LoginDialogContent extends React.Component {
  static propTypes = {
    title: PropTypes.node.isRequired,
    description: PropTypes.node,
    // eslint-disable-next-line react/forbid-prop-types
    providers: PropTypes.array,
    onLoginButtonClick: PropTypes.func,
    SanityLogo: PropTypes.func
  }

  static defaultProps = {
    description: null,
    providers: null,
    onLoginButtonClick: null,
    SanityLogo: null
  }

  handleLoginButtonClicked = (provider, event) => {
    const {onLoginButtonClick} = this.props
    if (onLoginButtonClick) {
      this.props.onLoginButtonClick(provider, event)
    } else {
      console.warn('LoginDialogContent is missing the onLoginButtonClick property') // eslint-disable-line no-console
    }
  }

  render() {
    const {title, description, providers, SanityLogo} = this.props
    return (
      <div className={styles.root}>
        <div className={styles.inner}>
          {SanityLogo && (
            <div className={styles.sanityLogo}>
              <SanityLogo />
            </div>
          )}

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h1 className={styles.cardTitle}>Sign in</h1>
            </div>

            <div className={styles.cardContent}>
              <div className={styles.branding}>
                <h1 className={BrandLogo ? styles.projectNameHidden : styles.projectName}>
                  {projectName}
                </h1>
                {BrandLogo && (
                  <div className={styles.brandLogoContainer}>
                    <BrandLogo projectName={projectName} />
                  </div>
                )}
              </div>

              <div>
                <h2 className={styles.title}>{title}</h2>
                {description && <div className={styles.description}>{description}</div>}
              </div>

              <ul className={styles.providers}>
                {providers.map(provider => {
                  const ProviderLogo = getProviderLogo(provider)
                  const onLoginClick = this.handleLoginButtonClicked.bind(this, provider)
                  return (
                    <li key={provider.name} className={styles.provider}>
                      {/* eslint-disable-next-line react/jsx-no-bind */}
                      <button
                        type="button"
                        onClick={onLoginClick}
                        className={styles.providerButton}
                      >
                        <span className={styles.providerLogo}>
                          <ProviderLogo />
                        </span>
                        <span className={styles.providerName}>{provider.title}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
