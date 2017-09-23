
export default function (...args) {

  let app, service

  if (this === undefined)
    ([ app, service ] = args)
  else {
    ([ service ] = args)
    app = this
  }

  for (const name in app.services)
    if (service === app.services[name])
      return name

  return null

}
