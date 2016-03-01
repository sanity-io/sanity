import React from 'react'

const styles = `
code {background: #f7f7f7;}
pre code {color: #444;}
code span {color: #880000;}`

const exampleManifest = `
{
  "plugins": [
    <span>"@sanity/base"</span>,
    <span>"@sanity/default-layout"</span>
  ]
}`

function DefaultRootComponent() {
  return (
    <div id="sanity-root">
      <style>{styles}</style>

      <h1>Welcome to Sanity!</h1>

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
        <br />For instance:
      </p>
      <pre>
        <code>{exampleManifest}</code>
      </pre>
    </div>
  )
}

export default DefaultRootComponent
