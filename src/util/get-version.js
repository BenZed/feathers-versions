import is from 'is-explicit/this'
import getVersionService from './get-versions-service'
import nameOfService from './name-of-service'

/******************************************************************************/
// Helpers
/******************************************************************************/

function isApp () {
  return this::is(Object) && this.service::is(Function)
}

function isService () {
  return this::is(Object) && 'id' in this
}

/******************************************************************************/
// Exports
/******************************************************************************/

export default async function getVersion (...args) {

  let app, serviceOrServiceName, docOrId

  // Allows function to be bound
  if (this === undefined)
    ([ app, serviceOrServiceName, docOrId ] = args)
  else {
    ([ serviceOrServiceName, docOrId ] = args)
    app = this
  }

  if (!app::isApp())
    throw new Error('getVersion needs to be bound to a feathers application, or as its first argument.')

  const service = serviceOrServiceName::isService()
    ? serviceOrServiceName
    : serviceOrServiceName::is(String)
      ? app.service(serviceOrServiceName)
      : null

  if (!service::isService())
    throw new Error(`getVersion needs a service object as its ${this ? 'first' : 'second'} argument.`)

  const serviceName = app::nameOfService(service)
  // ^^ Yeah, yeah, shut up.

  // If we passed in a plain object, we'll assume we're supposed to get the
  // id from the documents
  const id = docOrId::is.plainObject()
    ? docOrId[service.id]

    // Otherwise we'll assume that whatever was sent in IS the id
    : docOrId

  if (!id::is())
    throw new Error(`getVersion needs a document or documentId as its ${this ? 'second' : 'third'} argument.`)

  const versions = app::getVersionService()

  const query = {
    document: id,
    service: serviceName,
    $limit: 1
  }

  const [ version ] = await versions.find({ query })

  return version || null

}
