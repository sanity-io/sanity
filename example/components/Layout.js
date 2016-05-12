import React from 'react'
import DOMContentLoadedFix from 'react-domcontentloaded'

export default React.createClass({
  render() {
    return (
      <html>
        <head>
          <DOMContentLoadedFix />
          <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
          <title>Form builder demo</title>
          <script src="/browser/main.js" async />
          <link rel="stylesheet" href="/stylesheets/main.css" />
          <meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1, maximum-scale=1" />
        </head>
        <body>
          <h2>Form builder demo</h2>
          <div id="main" />
          <div id="debug" />
        </body>
      </html>
    )
  }
})
