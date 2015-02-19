import 'babel-core/polyfill'
import React from "react"
import Demo from "./lib/Demo.jsx"
import querystring from "querystring"

let params = querystring.parse(document.location.search.substring(1)) || {};

React.render(<Demo imageIndex={params.image}/>, document.getElementById('content'));