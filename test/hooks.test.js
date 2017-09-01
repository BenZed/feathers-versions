import chai, { expect, assert } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import is from 'is-explicit'

import hooks from 'feathers-hooks'
import memory from 'feathers-memory'
import feathers from 'feathers'

import versions, { addVersion, clearVersions } from '../src'

chai.use(chaiAsPromised)

/* global describe it beforeEach */

const quickApp = (config, service = 'messages') => feathers()
  .configure(hooks())
  .configure(versions())
  .use(service, memory())

const quickService = (app, config = {}, service = 'messages') => {

  const patch = addVersion(config)
  const create = patch
  const update = create

  const remove = clearVersions()

  return app.service(service)
    .hooks({ after: { patch, create, update, remove } })
}

describe('addVersion hook', () => {

  it('requires a version service to be initialized', () => {

    const app = feathers()
      .configure(hooks())

    const messages = app
      .use('messages', memory())
      .service('messages')
      .hooks({
        after: {
          create: addVersion()
        }
      })

    const msg = messages.create({ body: 'Success!' })

    return expect(msg)
      .to.eventually.be
      .rejectedWith('Version service not initialized.')

  })

  it('can only be used as an "after" "patch", "create" or "update" hook', async () => {

    let app = quickApp()

    const add = addVersion()

    const before = { all: add }
    const after = before

    let messages = app.use('messages', memory())
      .service('messages')
      .hooks({ before })

    let err = 'The \'add-version\' hook can only be used as a \'after\' hook'

    await expect(messages.find({})).to.eventually.be.rejectedWith(err)
    await expect(messages.get(0)).to.eventually.be.rejectedWith(err)
    await expect(messages.patch(0, {})).to.eventually.be.rejectedWith(err)
    await expect(messages.update(0, {})).to.eventually.be.rejectedWith(err)
    await expect(messages.remove(0)).to.eventually.be.rejectedWith(err)

    app = quickApp()
    messages = app.use('messages', memory())
      .service('messages')
      .hooks({ after })

    await expect(messages.create({ body: 'Success!' })).to.eventually.be.fulfilled
    await expect(messages.patch(0, { body: 'Horray!' })).to.eventually.be.fulfilled
    await expect(messages.update(0, { body: 'Fantastic!' })).to.eventually.be.fulfilled

    err = 'The \'add-version\' hook can only be used on the \'["update","patch","create"]\' service method(s).'

    await expect(messages.find({})).to.eventually.be.rejectedWith(err)
    await expect(messages.get(0)).to.eventually.be.rejectedWith(err)
    await expect(messages.remove(0)).to.eventually.be.rejectedWith(err)

  })

  it('creates a version on save', async () => {

    const app = quickApp()
    const messages = quickService(app)

    const message = await messages.create({ text: 'New message', urgent: false })
    const versions = app.service('versions')

    const { id } = message

    const version = await versions.find({ document: id, service: 'messages' })

    assert.deepEqual(message, version[0].list[0].data)

  })

  describe('limit parameter', () => {

    it('must be a number above 0')

    it('limits the number of versions that are saved in the back end')

  })

  describe('saveInterval parameter', () => {

    it('if defined, must be a number above 0')

    it('collapses versions created within [saveInterval] ms of each other')

  })

  describe('includeMask', () => {

    it('cannot be defined with an excludeMask')

    it('must be an array of strings')

    it('limits data saved to a version by including fields')

  })

  describe('excludeMask', () => {

    it('cannot be defined with an includeMask')

    it('must be an array of strings')

    it('limits data saved to a version by excluding fields')

  })

})

describe('clearVersions hook', () => {

  it('can only be used as an "after" "remove" hook.')

  it('removes versions associated with a successfully deleted document')

})
