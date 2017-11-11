import { nameOfService, getVersion, getVersionService } from '../util'
import { checkContext } from 'feathers-hooks-common/lib/services'
import is from 'is-explicit/this'

/******************************************************************************/
// Exports
/******************************************************************************/

export default function () {

  return async function (hook) {

    const { result, app, service } = hook

    checkContext(hook, 'after', 'remove', 'clear-versions')

    const versions = app::getVersionService()
    if (versions === null)
      throw new Error('Version service not initialized.')

    const results = result::is(Array) ? result : [ result ]

    for (const doc of results) {

      const name = app::nameOfService(service)

      const version = await app::getVersion(name, doc)
      if (version)
        await versions.remove(version[versions.id])

    }
  }
}
