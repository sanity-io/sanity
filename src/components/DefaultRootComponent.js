/* eslint-disable react/no-danger */
import React from 'react'

const styles = `
#sanity-root {font: 1.5em sans-serif; padding: 0 1em; max-width: 800px;}
code {background: #f7f7f7;}
pre code {color: #444; display: block; padding: 1em;}
code span {color: #880000;}
@media screen and (max-width: 480px) {
  #sanity-root {font-size: 1em; padding: 0 0.5em;}
}`

const exampleManifest = `{
  "plugins": [
    <span>"@sanity/base"</span>,
    <span>"@sanity/default-layout"</span>
  ]
}`

function DefaultRootComponent() {
  return (
    <div id="sanity-root">
      <style>{styles}</style>

      <h1>Hello, Sanity!</h1>

      <p>
        If you're seeing this, it means that no plugin has fulfilled
        the <code>@sanity/base/rootComponent</code> role.
      </p>

      <p>
        Usually, this role is filled by a plugin such
        as <code>@sanity/default-layout</code>.
      </p>

      <h2>How do I fix it?</h2>
      <p>
        In the <code>sanity.json</code> file of your Sanity configuration,
        add a plugin that fulfills the <code>@sanity/base/rootComponent</code> role.
        For instance:
      </p>
      <pre>
        <code dangerouslySetInnerHTML={{__html: exampleManifest}} />
      </pre>

      <p>
        Thanks for using Sanity!
      </p>
    </div>
  )
}

export default DefaultRootComponent
