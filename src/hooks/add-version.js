import { BadRequest, GeneralError } from 'feathers-errors'
import equal from 'deep-equal'
import is from 'is-explicit/this'

import { CONFIG, nameOfService, getVersionService } from '../util'

import { checkContext } from 'feathers-hooks-common/lib/services'

/******************************************************************************/
// Defaults
/******************************************************************************/

const DefaultOptions = {
  limit: 1000,
  saveInterval: null,
  includeMask: null,
  excludeMask: null
}

/******************************************************************************/
// Helper
/******************************************************************************/

function applyMasks (include, exclude) {

  const doc = this

  const mask = include || exclude
  if (mask === null)
    return { ...doc }

  const output = mask === include ? {} : { ...doc }

  mask.forEach(field => {
    if (field in doc && mask === include)
      output[field] = doc[field]

    else if (field in doc && mask === exclude)
      delete output[field]
  })

  // only return data if there's any to return
  return Object.keys(output).length === 0 ? null : output
}

function validateOptions (includeMask, excludeMask, limit, saveInterval) {

  if (includeMask::is() && !includeMask::is.arrayOf(String))
    throw new GeneralError('includeMask, if provided, must be an Array of strings.')

  if (excludeMask::is() && !excludeMask::is.arrayOf(String))
    throw new GeneralError('excludeMask, if provided, must be an Array of strings.')

  if (includeMask && excludeMask)
    throw new GeneralError('you may only supply excludeMask OR includeMask.')

  if (limit::is() && (!limit::is(Number) || limit < 2))
    throw new GeneralError('limit must be a number above 1')

  if (saveInterval::is() && (!saveInterval::is(Number) || saveInterval < 0))
    throw new GeneralError('saveInterval must be a number equal to or above 0')

}

/******************************************************************************/
// Hook
/******************************************************************************/

export default function (options = {}) {

  const { includeMask, excludeMask, limit, saveInterval } = { ...DefaultOptions, ...options }

  validateOptions(includeMask, excludeMask, limit, saveInterval)

  return async function (hook) {

    const { params, result, app, service } = hook

    checkContext(hook, 'after', ['update', 'patch', 'create'], 'add-version')

    const serviceName = app::nameOfService(service)
    const versions = app::getVersionService()

    if (versions === null)
      throw new GeneralError('Version service not initialized.')

    const { userEntityField, userIdField, idType } = versions[CONFIG]

    const user = params[userEntityField]
    const userId = user ? user[userIdField] : null

    if (versions === service)
      throw new BadRequest('You can\'t add a version of a version document, smartass.')

    const serviceIdField = service.id

    const results = result::is(Array) ? result : [ result ]

    for (const doc of results) {

      const id = doc[serviceIdField]
      const query = { document: idType(id), service: serviceName }

      const data = doc::applyMasks(includeMask, excludeMask)

      // only add a version if theres some data left after the masks
      if (data === null)
        return

      try {

        let [ version ] = await versions.find({ query })

        // ensure a version exists
        if (!version)
          version = await versions.create({ ...query, list: [] })

        const { list } = version

        const id = version[serviceIdField]

        const latest = list[list.length - 1]

        // only add a new version if the data is different
        if (latest && equal(data, latest.data))
          return

        let saved = new Date()

        // If updates are being made in rapid succession, we'll combine them into
        // one so that too many versions don't get made.
        if (saveInterval > 0 && latest && saved.getTime() - latest.saved.getTime() < saveInterval) {
          saved = latest.saved // combined versions still use the first update time
          list.pop()
        }

        // Add data for this version
        list.push({
          data,
          user: user ? userId : null,
          saved
        })

        // If we have more versions than the limit, remove the oldest versions
        if (list.length > limit)
          list.splice(0, list.length - limit)

        await versions.patch(id, { list })

      } catch (err) {

        throw new BadRequest(err)

      }

    }

  }

}
