'use strict'

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const sinonChai = require('sinon-chai')

chai.should()
chai.use(chaiAsPromised)
chai.use(sinonChai)
