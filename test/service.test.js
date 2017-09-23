import { expect } from 'chai'

import hooks from 'feathers-hooks'
import feathers from 'feathers'

import versions from '../src'

/* global describe it  */

const quickApp = config => feathers()
  .configure(hooks())
  .configure(versions(config))

describe('Service Configuration', () => {

  it('must be an object, if a configuration is given', () => {

    const INVALID = [ new Date(), 'string', /regex/, 1000, true, false ]

    for (const config of INVALID)
      expect(() => quickApp(config)).to.throw('Configuration, if supplied, must be a plain Object.')

    expect(() => quickApp({})).to.not.throw(Error)

  })

  it('serviceName must be a string.', () => {

    const INVALID = [ new Date(), {}, /nope/, 1000, true, false ]

    for (const serviceName of INVALID)
      expect(() => quickApp({ serviceName })).to.throw('serviceName must be a non-blank string.')

    expect(() => quickApp({ serviceName: 'history' })).to.not.throw()
  })

  it('userEntityField must be a string, if supplied', () => {

    const INVALID = [ new Date(), {}, /nope/, 1000, true, false ]

    for (const userEntityField of INVALID)
      expect(() => quickApp({ userEntityField })).to.throw('userEntityField must be a string, if supplied.')

    expect(() => quickApp({ userEntityField: 'worker' })).to.not.throw()

  })

  it('userIdField must be a string, if supplied', () => {

    const INVALID = [ new Date(), {}, /nope/, 1000, true, false ]

    for (const userIdField of INVALID)
      expect(() => quickApp({ userIdField })).to.throw('userIdField must be a string, if supplied.')

    expect(() => quickApp({ userIdField: 'id' })).to.not.throw()

  })

  it('adapter must be an object', () => {

    const INVALID = [ new Date(), {}, /nope/, 1000, true, false ]

    for (const userIdField of INVALID)
      expect(() => quickApp({ userIdField })).to.throw('userIdField must be a string, if supplied.')

    expect(() => quickApp({ userIdField: 'id' })).to.not.throw()

  })

  it('only one versions service can be created per app', () => {

    const app = quickApp()

    expect(() => app.configure(versions())).to.throw('Only one versions service can be initialized per app.')

  })

})
