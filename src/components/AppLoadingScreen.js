import React, {PropTypes} from 'react'
import SanityLogo from 'part:@sanity/base/sanity-logo'

const AppLoadingScreenStyles = `
@keyframes sanity-app-loading-screen__fadeIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

@keyframes sanity-app-loading-screen__spinner {
   from {left: -200px; width: 30%;}
   50% {width: 30%;}
   70% {width: 70%;}
   80% { left: 50%;}
   95% {left: 120%;}
   to {left: 100%;}
}

@-webkit-keyframes sanity-app-loading-screen__spinner {
   from {left: -200px; width: 30%;}
   50% {width: 30%;}
   70% {width: 70%;}
   80% { left: 50%;}
   95% {left: 120%;}
   to {left: 100%;}
}

@-webkit-keyframes sanity-app-loading-screen__fadeIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

.sanity-app-loading-screen {
  background-color: #f00;
}

.sanity-app-loading-screen__root {
  display: block;
}

.sanity-app-loading-screen__inner {
  position: fixed;
  top: 37vh;
  left: 50vw;
  -webkit-transform: translateX(-50%) translateY(-50%);
          transform: translateX(-50%) translateY(-50%);
  text-align: center;
}

.sanity-app-loading-screen__logo {
  min-width: 10rem;
  color: #383838;

  -webkit-animation-name: sanity-app-loading-screen__fadeIn;
          animation-name: sanity-app-loading-screen__fadeIn;
  -webkit-animation-duration: 0.15s;
          animation-duration: 0.15s;
  -webkit-animation-duration: 0.15s;
          animation-duration: 0.15s;

  animation-timing-function: ease-in;
  -webkit-animation-timing-function: ease-in;
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
  top: 43vh;
  left: 50vw;
  -webkit-transform: translateX(-50%);
          transform: translateX(-50%);
}

.sanity-app-loader__spinner-inner {
  height: 1px;
  width: 100vw;
  position: relative;
  overflow: hidden;
  background-color: #efefef;
}


.sanity-app-loader__spinner-inner:before {
  display: block;
  position: absolute;
  content: "";
  left: -200px;
  width: 200px;
  height: 2px;
  background-color: #aaa ;
  -webkit-animation: sanity-app-loading-screen__spinner 2s linear infinite;
  animation: sanity-app-loading-screen__spinner 2s linear infinite;
}`

export default class AppLoadingScreen extends React.Component {
  static propTypes = {
    text: PropTypes.string
  }

  static defaultProps = {
    text: ''
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
          <div className="sanity-app-loader__spinner-inner" />
        </div>
      </div>
    )
  }
}
