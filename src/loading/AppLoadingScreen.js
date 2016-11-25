import React, {PropTypes} from 'react'
import SanityLogo from 'part:@sanity/base/sanity-logo-icon'
import SpinnerIcon from 'part:@sanity/base/spinner-icon'


const AppLoadingScreenStyles = `
@-webkit-keyframes sanity-app-loader__spin {
  0% {
    -webkit-transform: rotate(0deg);
            transform: rotate(0deg);
  }

  100% {
    -webkit-transform: rotate(360deg);
            transform: rotate(360deg);
  }
}
@keyframes sanity-app-loader__spin {
  0% {
    -webkit-transform: rotate(0deg);
            transform: rotate(0deg);
  }

  100% {
    -webkit-transform: rotate(360deg);
            transform: rotate(360deg);
  }
}
@-webkit-keyframes sanity-app-loading-screen__colorFade {
  0% {
    fill: #383838;
    opacity: 100%;
  }

  30% {
    fill: #383838;
    opacity: 50%;
  }

  60% {
    fill: #2097ac;
    opacity: 70%;
  }

  90% {
    fill: #f43;
    opacity: 10%;
  }
}

@keyframes sanity-app-loading-screen__colorFade {
  0% {
    fill: #383838;
    opacity: 100%;
  }

  30% {
    fill: #383838;
    opacity: 50%;
  }

  60% {
    fill: #2097ac;
    opacity: 70%;
  }

  90% {
    fill: #f43;
    opacity: 10%;
  }
}

.sanity-app-loading-screen__root {
  display: block;
}

.sanity-app-loading-screen__inner {
  position: fixed;
  top: 50vh;
  left: 50vw;
  -webkit-transform: translateX(-50%) translateY(-50%);
          transform: translateX(-50%) translateY(-50%);
  text-align: center;
}

.sanity-app-loading-screen__logo {
  font-size: 5em;
  color: #383838;
}

.sanity-app-loading-screen__logo .sanityIconAnimate path:nth-child(odd) {
  -webkit-animation-name: sanity-app-loading-screen__colorFade;
          animation-name: sanity-app-loading-screen__colorFade;
  -webkit-animation-duration: 5s;
          animation-duration: 5s;
  -webkit-animation-duration: 5s;
          animation-duration: 5s;
  -webkit-animation-iteration-count: infinite;
          animation-iteration-count: infinite;
  -webkit-animation-direction: alternate;
          animation-direction: alternate;
}

.sanity-app-loading-screen__logo .sanityIconAnimate path:nth-child(even) {
  -webkit-animation-name: sanity-app-loading-screen__colorFade;
          animation-name: sanity-app-loading-screen__colorFade;
  -webkit-animation-duration: 5s;
          animation-duration: 5s;
  -webkit-animation-duration: 5s;
          animation-duration: 5s;
  -webkit-animation-iteration-count: infinite;
          animation-iteration-count: infinite;
  -webkit-animation-direction: alternate-reverse;
          animation-direction: alternate-reverse;
}

.sanity-app-loading-screen__text {
  font-weight: 400
  font-size: 5em;
  font-family: sans-serif;
}

.sanity-app-loading-screen__spinner {
  display: block;
  z-index: 1;
  position: fixed;
  top: 75vh;
  left: 50vw;
  -webkit-transform: translateX(-50%);
          transform: translateX(-50%);
}
.sanity-app-loader__spinner-inner {
  position: absolute;
  height: 1em;
  width: 1em;
}

.sanity-app-loader__spinner-inner svg {
  -webkit-transform-origin: center center;
          transform-origin: center center;
  -webkit-animation-name: sanity-app-loader__spin;
          animation-name: sanity-app-loader__spin;
  -webkit-animation-duration: 2s;
          animation-duration: 2s;
  -webkit-animation-timing-function: linear;
          animation-timing-function: linear;
  -webkit-animation-iteration-count: infinite;
          animation-iteration-count: infinite;
}
`

export default class AppLoadingScreen extends React.Component {
  static propTypes = {
    text: PropTypes.string
  }

  static defaultProps = {
    text: 'Restoring sanity…'
  }

  render() {
    return (
      <div className="sanity-app-loading-screen">
        <style type="text/css">{AppLoadingScreenStyles}</style>
        <div className="sanity-app-loading-screen__inner">
          <div className="sanity-app-loading-screen__logo">
            <SanityLogo />
          </div>
          <div className="sanity-app-loading-screen__text">
            {this.props.text}
          </div>
        </div>
        <div className="sanity-app-loading-screen__spinner">
          <div className="sanity-app-loader__spinner-inner">
            <SpinnerIcon />
          </div>
        </div>
      </div>
    )
  }
}
