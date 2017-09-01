import { CONFIG, nameOfService, getVersionsService } from '../util'

import { checkContext } from 'feathers-hooks-common/lib/services'

/******************************************************************************/
// Exports
/******************************************************************************/

export default function () {

  return async function (hook) {

    const { result, app } = hook
    const service = this

    checkContext(hook, 'after', 'remove', 'clear-versions')

    const versions = getVersionsService(app)
    if (versions === null)
      throw new Error('Version service not initialized.')

    const results = Array.isArray(result) ? result : [ result ]

    for (const doc of results) {

      const id = doc[service.id]

      const query = {
        document: versions[CONFIG].idType(id),
        service: nameOfService(app, service)
      }

      try {

        // if the document can be found, we continue without removing it's versions
        // This would happen if there was an error during the remove hook, such as
        // a permissions failure, or if the document was soft-deleted
        await service.get(id)

      } catch (err) {

        if (err.message !== `No record found for id '${id}'`)
          throw err

        // if we cant find the service document, it's because removing it was
        // successful, and we'll continue with removing all of it's versions
        const [ version ] = await versions.find({ query })
        if (version)
          await versions.remove(version[versions.id])

      }
    }
  }
}
