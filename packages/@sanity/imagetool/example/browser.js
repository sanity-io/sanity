import 'babel/polyfill'
import Debug from "debug"
Debug.disable('');
Debug.enable(process.env.DEBUG);
import React from "react"
import Demo from "./lib/Demo.jsx"
import querystring from "querystring"

let params = querystring.parse(document.location.search.substring(1)) || {};

React.render(<Demo imageIndex={params.image}/>, document.getElementById('content'));
