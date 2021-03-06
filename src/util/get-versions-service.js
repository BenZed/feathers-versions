import CONFIG from './version-service-config-symbol'

export default function (input) {

  const app = this || input

  for (const name in app.services) {
    const service = app.services[name]

    if (CONFIG in service)
      return service
  }

  return null

}
