import hooks from 'feathers-hooks'
import feathers from 'feathers'
import memory from 'feathers-memory'

import versions, { addVersion, clearVersions } from '../src'

export const quickApp = (config, service = 'messages') => feathers()
  .configure(hooks())
  .configure(versions())
  .use(service, memory())

export const quickService = (app, config = {}, service = 'messages') => {

  const patch = addVersion(config)
  const create = patch
  const update = create

  const remove = clearVersions()

  return app.service(service)
    .hooks({ after: { patch, create, update, remove } })

}
