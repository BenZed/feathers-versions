import { expect, assert } from 'chai'
import is from 'is-explicit'

import hooks from 'feathers-hooks'
import memory from 'feathers-memory'
import feathers from 'feathers'

import versions, { addVersion, clearVersions } from '../../src'

/* global describe it */

describe('Versions service', () => {

  const app = feathers()
    .configure(hooks())
    .configure(versions({
      service: memory()
    }))

  const add = addVersion({
    excludeMask: [ 'id' ]
  })

  const clear = clearVersions()

  const messages = app
    .use('messages', memory())
    .service('messages')
    .hooks({
      after: {
        patch: add,
        create: add,
        update: add,
        remove: clear
      }
    })

  it('saves versions when a service is patched, created or updated', async () => {

    const message = await messages.create({ text: 'New message', urgent: false })
    const versions = app.service('versions')

    const { id, ...rest } = message

    const version = await versions.find({ document: id, service: 'messages'})

    assert.deepEqual(rest, version[0].list[0].data)

  })

})
