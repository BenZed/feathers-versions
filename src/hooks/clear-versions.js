import { CONFIG, nameOfService, getVersionsService} from '../util'

import { checkContext } from 'feathers-hooks-common/lib/services'

/******************************************************************************/
// Exports
/******************************************************************************/

export default function() {

  return async function(hook) {

    const { id, app } = hook
    const service = this

    checkContext(hook, 'after', ['remove'], 'clear-verions')

    const versions = getVersionsService(app)

    const query = {
      document: versions[CONFIG].idType(id),
      service: nameOfService(app, service)
    }

    try {

      //if the document can be found, we continue without removing it's versions
      //This would happen if there was an error during the remove hook, such as
      //a permissions failure, or if the document was soft-deleted
      await service.get(id)

    } catch (err) {

      //if we cant find the service document, it's because removing it was
      //successful, and we'll continue with removing all of it's versions
      //TODO add a check on the error to ensure it's failing for the reason
      //we assume it is
      const [ version ] = await service.find({ query })

      if (version)
        await versions.remove(version._id)

    }
  }
}
