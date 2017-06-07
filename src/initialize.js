import memory from 'feathers-memory'
import { disallow } from 'feathers-hooks-common'
import CONFIG from './util/version-service-config-symbol'

/******************************************************************************/
// Default Config
/******************************************************************************/

const DefaultConfig = {

  idType: Number,
  adapter: null,

  serviceName: 'versions',

  userEntityField: 'users',
  userIdField: '_id'

}

/******************************************************************************/
// Hooks
/******************************************************************************/

function castQuery(hook, next) {

  const { params } = hook
  const { query } = params

  const { idType } = this[CONFIG]

  if (query && query.document)
    query.document = idType(query.document)

  return next(null, hook)

}

const internal = disallow('external')

const before = {
  all:   [ castQuery ],
  update: [ internal ],
  patch:  [ internal ],
  create: [ internal ],
  remove: [ internal ]
}

/******************************************************************************/
// Service
/******************************************************************************/

export default function(config = {}) {

  const { idType, serviceName, adapter, userEntityField, userIdField } =
    { ...DefaultConfig, ...config }

  return function() {

    const app = this

    app.use('/' + serviceName, adapter || memory())

    const versions = app.service(serviceName)

    versions[CONFIG] = {
      idType,
      userEntityField,
      userIdField
    }

    Object.freeze(versions[CONFIG])

    versions.hooks({ before })

  }

}
