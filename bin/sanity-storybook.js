#!/usr/bin/env node
/* eslint-disable */
var path = require('path')
var resolveFrom = require('resolve-from')
var storybookPath = path.dirname(require.resolve('@kadira/storybook/package.json'))
var storybookPkg = require('@kadira/storybook/package.json')
var binLocation = storybookPkg.bin['start-storybook']

require(resolveFrom(storybookPath, binLocation))
