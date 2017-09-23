import { getVersion } from '../src'
import { assert, expect } from 'chai'
import { quickApp, quickService } from './commons'

/* global describe it before */

describe('getVersion method', () => {

  let app, messages
  before(() => {

    app = quickApp()

    messages = quickService(app, { excludeMask: [ 'id' ] })

  })

  it('is bound to an app or takes an app as its first argument', () => {
    const notApps = [ null, {}, { service: {} }, false, undefined ]
    for (const notApp of notApps)
      expect(getVersion(notApp)).to.eventually.be.rejectedWith('getVersion needs to be bound to a feathers application, or as its first argument.')

    for (const notApp of notApps)
      expect(notApp::getVersion()).to.eventually.be.rejectedWith('getVersion needs to be bound to a feathers application, or as its first argument.')

    return expect(app::getVersion('messages', 0)).to.eventually.be.fulfilled
  })

  it('takes a service or servicename as its first or second argument', async () => {
    const notServices = [ null, {}, 'not-a-service-name', false, undefined ]

    for (const notService of notServices) {
      await expect(app::getVersion(notService)).to.eventually.be.rejectedWith(`getVersion needs a service object as its first argument.`)
      await expect(getVersion(app, notService)).to.eventually.be.rejectedWith(`getVersion needs a service object as its second argument.`)
    }

    await expect(app::getVersion('messages', 0)).to.eventually.be.fulfilled

    await expect(app::getVersion(messages, 0)).to.eventually.be.fulfilled

  })

  it('takes a document or documentid as its second or third argument', async () => {

    const msg = await messages.create({ body: 'wee' })

    await expect(app::getVersion('messages', msg)).to.eventually.be.fulfilled
    await expect(app::getVersion('messages', msg.id)).to.eventually.be.fulfilled

    await expect(app::getVersion('messages', null)).to.eventually.be.rejectedWith('getVersion needs a document or documentId as its second argument.')
    await expect(getVersion(app, messages, undefined)).to.eventually.be.rejectedWith('getVersion needs a document or documentId as its third argument.')

    await expect(app::getVersion('messages', msg.id)).to.eventually.be.fulfilled

  })

  it('gets the version data for a document', async () => {

    const data = { body: 'Word.', author: 'Homie' }

    const msg = await messages.create(data)

    const version = await getVersion(app, 'messages', msg)

    assert(version && version.document === msg.id, 'Didnt get version for msg')
    assert.deepEqual(version.list[0].data, data)

  })

  it('can have be bound to app', async () => {
    const data = { body: 'Word.', author: 'Homie' }
    const msg = await messages.create(data)

    const version1 = await getVersion(app, 'messages', msg)
    const version2 = await app::getVersion('messages', msg)

    assert.deepEqual(version1, version2, 'Did not behave consistently')
  })

})
