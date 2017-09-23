# Feathers Versions

# ALPHA VERSION DOCUMENTATION
If you're reading this, feathers-versions is in alpha, and not all of the functionality is fully described or finalized.

___
# Why?
  - You're using [feathers.js](http://www.feathersjs.com) serverside, and you'd like to save versions of service documents.
  - You love your family.
___

# QuickStart

The following assumes you're familiar with [feathers.js](http://www.feathersjs.com) workflow. If you've never heard of [feathers.js](http://www.feathersjs.com) before, it's great. Learn it: [feathers.js](http://www.feathersjs.com)

## Install

`
npm install feathers-versions
`

## Set Up Versions Service

```js
import feathers from 'feathers'
import hooks from 'feathers-hooks'
import versions from 'feathers-versions'

//set up a quick app that will allow you to create documents server side
const app = feathers()
  .configure(hooks())

  //calling versions without any arguments gives the default configuration
  .configure(versions())
```

## Set up a Service that will use Versioning

Once the version service has been set up, you need to add a couple
of `hooks` to any `service` that you want to use versions.

The `addVersion` hook can only be placed as `after` `patch`, `create` and `update` hooks, and typically you'd want them on all three.

The `clearVersions` can only be placed as a `after` `remove` hook.

```js

import { addVersion, clearVersions } from 'feathers-hooks'
import memory from 'feathers-memory'

const articles = app
  //for the sake of example, we'll set up an in memory service
  .use('articles', memory())
  .service('articles')

//configure your add and clear hooks
const add = addVersion({
  excludeMask: ['id'] //we don't need to save the id for every version.
})
const clear = clearVersions()

//apply the hooks to the articles service.
articles.hooks({
  after: {
     //we'll want to add a version whenever a document is patched, created or updated.
    patch: add,
    create: add,
    update: add,
    //and we'll want to remove versions when a document is deleted.
    remove: clear
  }
})
```

## Create a Document

That's it! Now, when you create or edit article documents, they'll have versions saved on the version service.

```js
articles.create({ body: 'I hate sandwhiches!', author: 'James McSoup' })
  .then( article => {

    const query = { document: article.id, service: 'articles' }

    //get the version for it
    return app.service('versions').find({ query })
  })
  .then( versions => {
    const version = versions[0]

    console.log(version)

    //A version document in this case would have the following structure:
    {
      id: 0, // id of version document
      document: 0, // id of article document
      list: //each of the saved versions, from earliest to latest
        [{
          saved: Date, //when the version was saved
          user: null,  //if there was a user entity associated with the call, this would be that users id
          data: { body: 'I love sandwhiches!', author: 'James McSoup'} // the actual data of the saved version
        }]
    }
  })

```
___

# Service Configuration

The service configuration comes with a couple of options, most importantly the *adapter* field:

## `idType` and `adapter`

If you don't provide a a database adapter, `feathers-versions` will use `feathers-memory` by default, which probably won't be very useful.

idType is the constructor for the dataType that your id will be in. `Number` by default. This is important to set if you are using service adapters that don't user strings or numbers as ids, like mongodb.

To set the versions service to use mongodb:

```js
import feathers from 'feathers'
import MongoService from 'feathers-mongodb'
import { ObjectId, MongoClient } from 'mongodb'
import hooks from 'feathers-hooks'
import versions from 'feathers-versions'

import MONGO_DB_URL from './mongo-db-url'

//once again, create an app that will allow you to create documents server-side
const app = feathers()
  .configure(hooks())

MongoClient.connect(MONGO_DB_URL)
  .then(db => {

    //create your mongo adapter
    const adapter = new MongoService({
      Model: db.collection('versions')
    })

    //configure your versions service. It's important to set idType to ObjectId, here
    app.configure(versions({
      idType: ObjectId,
      adapter
    }))

  })

```

## `serviceName`

By default, the service name for the versions service will simply be *versions*.
If you'd like it to be something else, set this option:

```js
import feathers from 'feathers'
import hooks from 'feathers-hooks'
import versions from 'feathers-versions'

const app = feathers()
  .configure(hooks())
  .configure(versions({
    serviceName: 'history'
  }))

//ta daa
const historyService = app.service('history')
```

## `userEntityField` and `userIdField`

These fields are used for getting a authenticated user object. If a user patches
an document that uses versioning, `feathers-versions` will save that users id with
the version data.

By default `userEntityField` is _user_ and `userIdField` is *_id*

___
# `addVersion` Hook Configuration

There are a couple of options when adding version hooks to documents:

## `limit`

A limit to how many versions can be stored. If the limit is reached, the oldest
versions will be deleted to make room for new ones. Default is _1000_.

## `saveInterval`

If set, `saveInteval` should be a number in milliseconds. New versions added in
less than the set number of milliseconds will be collapsed together. This is so that
if multiple changes are made frequently, they'll be considered one version. By default,
a version will be created with every patch or update.

## `excludeMask` and `includeMask`

You should set EITHER `excludeMask` or `includeMask`, not both, and they
should be an array of strings, representing field names.

These fields will mask the data that gets saved to a version, so that redundant fields
are ignored.

___

# `clearVersions` Hook Configuration

The `clearVersions` hook currently receives no configuration.
___

# `getVersion` helper method.

`feathers-versions` also exports a helper method called `getVersion`

It simplifies getting the version data for a specific document.

```js

import { getVersion } from 'feathers-versions'
import app from './app' // assume we have a properly set up app here

void async function test () {

  const articles = app.service('articles')

  const doc = await articles.create({ body: 'Informed opinion.', author: 'Some Guy' })

  let docVersions
  docVersions = await getVersion(app, 'articles', doc.id)
  // OR, getVersion can also be bound to app for readability
  docVersions = await app::getVersion('articles', doc.id)

  console.log(docVersions) /*
  {
    id: 0,
    document: 0,
    service: 'articles',
    list: [{
      user: null,
      updated: [Date],
      data: { body: 'Informed opinion.', author: 'Some Guy' }
    }]

  }
  */
}



```

# Further Considerations

- New versions will not be created if none of the masked data has been changed.
