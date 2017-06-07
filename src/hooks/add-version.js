import { BadRequest } from 'feathers-errors'
import equal from 'deep-equal'
import is from 'is-explicit'

import { CONFIG, nameOfService, getVersionsService} from '../util'

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

function applyMasks(input, include, exclude) {

  const mask = include || exclude
  if (mask === null)
    return input

  const output = mask == include ? {} : {...input}

  mask.forEach(field => {
    if (field in input && mask == include)
      output[field] = input[field]

    else if (field in input && mask == exclude)
      delete output[field]
  })

  //only return data if there's any to return
  return Object.keys(output).length === 0 ? null : output
}

function validateOptions(includeMask, excludeMask, limit, saveInterval) {

  if (includeMask !== null && !is(includeMask, Array))
    throw new Error('includeMask, if provided, must be an Array.')

  if (excludeMask !== null && !is(excludeMask, Array))
    throw new Error('excludeMask, if provided, must be an Array.')

  if (includeMask && excludeMask)
    throw new Error('you may only supply an excludeMask OR and includeMask.')

  if (!is(limit, Number) || limit < 2)
    throw new Error('limit must be a number above 1')

  if (is(saveInterval, Number) && saveInterval < 0)
    throw new Error('saveInterval must be a number equal to or above 0')

}

/******************************************************************************/
// Hook
/******************************************************************************/

export default function(options = {}) {

  const { includeMask, excludeMask, limit, saveInterval }
    = { ...DefaultOptions, ...options }

  validateOptions(includeMask, excludeMask, limit, saveInterval)

  return async function(hook) {

    const { params, result, app } = hook
    const { provider } = params
    const service = this

    checkContext(hook, 'after', ['update', 'patch', 'create'], 'add-version')

    const serviceName = nameOfService(app, service)
    const versions = getVersionsService(app)

    if (versions === null)
      throw new Error('Version service not initialized.')

    const { userEntityField, userIdField, idType } = versions[CONFIG]

    const user = params[userEntityField]
    const userId = user ? user[userIdField] : null

    if (versions == service)
      throw new Error('You can\'t add a version of a version document, smartass.')

    const serviceIdField = service.id
    const id = result[serviceIdField]
    const query = { document: idType(id), service: serviceName }

    const data = applyMasks(result, includeMask, excludeMask)

    //only add a version if theres some data left after the masks
    if (data === null)
      return

    try {

      const found = await versions.find({ query })

      //ensure a version exists
      const version = found[0] || await versions.create({ ...query, list: [] })

      const { list, limit } = version

      const id = version[serviceIdField]

      const latest = list[list.length - 1]

      //only add a new version if the data is different
      if (latest && equal(data, latest.data))
        return

      let saved = new Date()

      //If updates are being made in rapid succession, we'll combine them into
      //one so that too many versions don't get made.
      if (latest && saved.getTime() - latest.saved.getTime() < saveInterval) {
        saved = latest.saved // combined versions still use the first update time
        list.pop()
      }

      //Add data for this version
      list.push({
        data,
        user: user ? userId : null,
        saved
      })

      //If we have more versions than the limit, remove the oldest versions
      if (list.length > limit)
        list.splice(0, list.length - limit)

      await versions.patch(id, { list })

    } catch (err) {

      throw new BadRequest(err)

    }

  }

}
