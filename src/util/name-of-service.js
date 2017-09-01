
export default function (app, service) {

  for (const name in app.services)
    if (service === app.services[name])
      return name

  return null

}
