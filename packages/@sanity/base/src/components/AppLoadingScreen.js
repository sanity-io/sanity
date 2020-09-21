/* eslint-disable max-len */
import PropTypes from 'prop-types'
import React from 'react'

const AppLoadingScreenStyles = `
.sanity-app-loading-screen {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
  text-align: center;
  background-color: #F1F3F6;
  color: #1C2430;
  display: flex;
  width: 100vw;
  height: 100vh;
  position: absolute;
  top: 0;
  left: 0;
}

.sanity-app-loading-screen__inner {
  margin: auto;
}

.sanity-app-loading-screen__text {
  margin-top: 2rem;
  font-size: 13px;
  font-weight: 600;
}

.sanity-app-loading-screen__loader {
  display: block;
  animation: pulse var(--time) cubic-bezier(.11,0,.27,1) infinite;
  --time: 3s;
}

@keyframes pulse {
  from {
    transform: scale3d(0.75, 0.75, 0.75);
  }
  
  50% {
    transform: scale3d(1, 1, 1);
  }
  
  to {
    transform: scale3d(0.75, 0.75, 0.75);
  }
}
`

const AppLoaderStyles = `
  .fillShape {
    stroke-width: 40;
    stroke: #F03E2F;
    opacity: 0;
  }
  
  .fillShape--bottom {
    stroke-dasharray: 90;
    stroke-dashoffset: 85;
    animation: bottom var(--time) ease-in infinite;
  }
  
  .fillShape--middle {
    stroke-dasharray: 115;
    stroke-dashoffset: 110;
    animation: middle var(--time) linear infinite;
  }
  
  .fillShape--top {
    stroke-dasharray: 77;
    stroke-dashoffset: 72;
    animation: top var(--time) ease-out infinite;
  }
  
  @keyframes bottom {
    0%,
    85% {
      stroke-dashoffset: 265;
      opacity: 0;
    }
    15%,
    64% {
      stroke-dashoffset: 175;
      opacity: 0.5;
    }
  }
  @keyframes middle {
    11%,
    75% {
      stroke-dashoffset: 100;
      opacity: 0;
    }
    15% {
      opacity: 1;
    }
    25%,
    63% {
      stroke-dashoffset: 225;
      opacity: 1;
    }
  }
  @keyframes top {
    22%,
    70% {
      opacity: 0;
      stroke-dashoffset: 226;
    }
    25% {
      opacity: 0.5;
    }
    35%,
    54% {
      stroke-dashoffset: 149;
      opacity: 0.5;
    }
  }
`

export default class AppLoadingScreen extends React.PureComponent {
  static propTypes = {
    text: PropTypes.string
  }

  static defaultProps = {
    text: 'Loading Content Studio'
  }

  render() {
    return (
      <div className="sanity-app-loading-screen">
        <style type="text/css">{AppLoadingScreenStyles}</style>
        <div className="sanity-app-loading-screen__inner">
          <div className="sanity-app-loading-screen__loader">
            <svg
              width="73"
              height="95"
              viewBox="0 0 73 95"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              shapeRendering="geometricPrecision"
            >
              <style>{AppLoaderStyles}</style>
              <mask
                id="bottom"
                mask-type="alpha"
                maskUnits="userSpaceOnUse"
                x="0"
                y="62"
                width="67"
                height="33"
              >
                <path
                  d="M56.4905 62.9807C63.6434 67.5637 66.7972 73.9744 66.7972 83.168C60.7987 90.7262 50.4577 95 38.2203 95C17.6963 95 3.17759 84.8102 0.0100098 67.282H19.7851C22.3343 75.3761 29.0748 79.1209 38.0622 79.1209C49.056 79.1209 56.3462 73.2598 56.4905 62.9807"
                  fill="white"
                />
              </mask>
              <g mask="url(#bottom)">
                <path
                  className="fillShape fillShape--bottom"
                  d="M8 59C9.35605 77.6466 25.4128 87.4032 37.5 87.5C54 87.6322 62 75 71.5 66.5"
                />
              </g>

              <mask
                id="middle"
                mask-type="alpha"
                maskUnits="userSpaceOnUse"
                x="2"
                y="12"
                width="71"
                height="72"
              >
                <path
                  d="M7.73317 12.1206C7.73317 24.8871 15.6418 32.5484 31.4729 36.568L48.2521 40.4571C63.238 43.8926 72.3834 52.4472 72.3834 66.3818C72.493 72.4436 70.5187 78.3594 66.7904 83.1404C66.7904 69.2402 59.5963 61.7232 42.2605 57.2157L25.7698 53.471C12.5842 50.4683 2.40806 43.4323 2.40806 28.2952C2.33733 22.4523 4.21324 16.7521 7.74004 12.0931"
                  fill="white"
                />
              </mask>
              <g mask="url(#middle)">
                <path
                  className="fillShape fillShape--middle"
                  d="M-15.5 8.5C-15.5 12 -1 41.7047 38.3457 48C65.7344 52.3822 69 68 62.8457 74.5C56.6914 81 54.5 82 54.5 82"
                />
              </g>

              <mask
                id="top"
                mask-type="alpha"
                maskUnits="userSpaceOnUse"
                x="7"
                y="0"
                width="65"
                height="32"
              >
                <path
                  d="M18.0122 31.1124C11.1411 26.7149 7.70557 20.524 7.70557 12.1138C13.4636 4.59677 23.3648 0 35.5198 0C56.4973 0 68.6317 11.09 71.6275 26.6737H52.5945C50.4988 20.5309 45.2562 15.7348 35.6641 15.7348C25.4399 15.7348 18.4863 21.6852 18.0122 31.1124"
                  fill="white"
                />
              </mask>
              <g mask="url(#top)">
                <path
                  className="fillShape fillShape--top"
                  d="M9 35C9 21 19 5.49993 40 8.49996C61 11.5 65.3456 29 65.3456 33.5"
                />
              </g>
            </svg>
          </div>
          <div className="sanity-app-loading-screen__text">{this.props.text}</div>
        </div>
      </div>
    )
  }
}
