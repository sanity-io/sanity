/**
 * Code borrowed from Joi (https://github.com/hapijs/joi), which is licensed under the BSD-3-Clause license
 * See https://github.com/hapijs/joi/blob/master/LICENSE for full license terms.
 *
 * Copyright (c) 2012-2017, Joi project contributors
 * Copyright (c) 2012-2014, Walmart
 */
const rfc3986 = require('./rfc3986')

const createUriRegex = (optionalScheme, allowRelative, relativeOnly) => {
  let scheme = rfc3986.scheme
  let prefix

  if (relativeOnly) {
    prefix = `(?:${rfc3986.relativeRef})`
  } else {
    // If we were passed a scheme, use it instead of the generic one
    if (optionalScheme) {
      // Have to put this in a non-capturing group to handle the OR statements
      scheme = `(?:${optionalScheme})`
    }

    const withScheme = `(?:${scheme}:${rfc3986.hierPart})`

    prefix = allowRelative ? `(?:${withScheme}|${rfc3986.relativeRef})` : withScheme
  }

  /**
   * URI = scheme ":" hier-part [ "?" query ] [ "#" fragment ]
   *
   * OR
   *
   * relative-ref = relative-part [ "?" query ] [ "#" fragment ]
   */
  return new RegExp(`^${prefix}(?:\\?${rfc3986.query})?(?:#${rfc3986.fragment})?$`)
}

module.exports = createUriRegex
