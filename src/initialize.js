import memory from 'feathers-memory'
import { disallow } from 'feathers-hooks-common'
import { CONFIG, getVersionService } from './util'
import is from 'is-explicit'

/******************************************************************************/
// Default Config
/******************************************************************************/

const DefaultConfig = {

  idType: Number,
  adapter: null,

  serviceName: 'versions',

  userEntityField: 'user',
  userIdField: '_id'

}

function validateConfig (idType, serviceName, adapter, userEntityField, userIdField) {

  if (!is(idType, Function))
    throw new Error('idType must be a Type declaration (typically String, Number or ObjectId)')

  if (!is(serviceName, String) || serviceName.length === 0)
    throw new Error('serviceName must be a non-blank string.')

  if (is(adapter) && !is(adapter, Object))
    throw new Error('adapter must be a Service instance.')

  if (is(userEntityField) && !is(userEntityField, String))
    throw new Error('userEntityField must be a string, if supplied.')

  if (is(userIdField) && !is(userIdField, String))
    throw new Error('userIdField must be a string, if supplied.')

}

/******************************************************************************/
// Hooks
/******************************************************************************/

function castQuery (hook, next) {

  const { params } = hook
  const { query } = params

  const { idType } = this[CONFIG]

  if (query && query.document)
    query.document = idType(query.document)

  return next(null, hook)

}

const internal = disallow('external')

const before = {
  all: [ castQuery ],
  update: [ internal ],
  patch: [ internal ],
  create: [ internal ],
  remove: [ internal ]
}

/******************************************************************************/
// Service
/******************************************************************************/

export default function (config = {}) {

  if (!is(config, Object) || config.constructor !== Object)
    throw new Error('Configuration, if supplied, must be a plain Object.')

  const { idType, serviceName, adapter, userEntityField, userIdField } =
    { ...DefaultConfig, ...config }

  validateConfig(idType, serviceName, adapter, userEntityField, userIdField)

  return function () {

    const app = this

    if (app::getVersionService() !== null)
      throw new Error('Only one versions service can be initialized per app.')

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
