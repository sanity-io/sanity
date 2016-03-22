'use strict'

const path = require('path')
const mocha = require('mocha')
const rewriteCss = require('../src/rewriteCss')

const it = mocha.it
const describe = mocha.describe

const rewrite = opts => rewriteCss(opts).then(res => res.css)

describe('css rewriter', () => {
  it('removes self-references, leaves others', () => {
    return rewrite({
      role: 'style:same/role',
      css: [
        '.foo { background: red; composes: bar from "style:foo/bar" ; }', // Double quotes
        '.foo { composes: foo from \'style:same/role\'; color: white; }', // Single quotes
        '.foo { content:"bar";composes: bar from "style:same/role"; }' // Different selector
      ].join('\n')
    }).should.eventually.equal([
      '.foo { background: red; composes: bar from "style:foo/bar" ; }',
      '.foo { color: white; }',
      '.foo { content:"bar";composes: bar; }'
    ].join('\n'))
  })

  it('removes compose declarations that references itself', () => {
    return rewrite({
      role: 'style:same/role',
      css: '.foo { composes: foo; color: red; }'
    }).should.eventually.equal('.foo { color: red; }')
  })

  it('should fix non-role paths', () => {
    return rewrite({
      role: 'style:foo/bar',
      css: '.foo { composes: bar from "./bar.css"; }',
      path: path.join(__dirname, 'fake.css'),
      relativeTo: path.join(__dirname, '..')
    }).should.eventually.equal('.foo { composes: bar from "test/bar.css"; }')
  })
})
