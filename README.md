# mockzen

**Your code isnt untestable, your testing tools are too rigid.**

## Introduction

Make any piece of code testable! Easily mock any dependencies in your code during testing

- doesn't matter what paradigm you are using - no rearchitecture to ioc containers required
- doesn't matter the way you or your NPM dependencies import/export functions, classes, etc.
- doesn't matter if function, class, instance of class, variable, etc.
- guaranteed mocking or immediate failure - no implicit behavior
- requires minimal code changes

Just change your code from:

```typescript
function getRandomFact() {
  const res = await fetch('https://catfact.ninja/fact')
}
```

to this (wrapping dependency code in "dep"):

```typescript
function getRandomFact() {
  const res = await dep(fetch)('https://catfact.ninja/fact')
}
```

or using code injection (see below):

```typescript
function getRandomFact() {
  dep.injectable({ fetch })
  const res = await fetch('https://catfact.ninja/fact')
}
```

During runtime, the code will behave exactly as before!

But in the tests, you can overwrite its behavior. For this, register a mock:

```typescript
function fakeFetch(url) {
  return {
    async json() {
      return { fact: 'hey'}
    }
  }
}

dep.register(fetch, fakeFetch)
```

If you did not register the mock, your test will fail, so there's no surprise about whether you correctly mocked something or not!

## Get Started

Install:

```bash
npm install mockzen
```

In your test or global setup of your tests, turn on the requirement for mocks like this:

```typescript
import { dep } from 'mockzen'

dep.enableTestEnv()
```

Alternatively, you can set the environment variable `MOCKZEN_TEST_ENV` to `true` or `1` for test runners like jest, which lack a global setup function that runs in the same process.

If you want to verify that dep is indeed looking up dependencies, you can do so like this in your tests:

```typescript
expect(dep.testEnvEnabled).toBe(true)
```

See below for setting up code injection.

## Naming dependencies

There is no need to name dependencies that are functions or classes. For example:

```typescript
dep(SomeService)
dep(someFunction)
```

But you need to name dependencies that can't be looked up using shallow comparison:

For example, this won't work because the variable "api" is not equal to "testApi":

```typescript
// code
const api = new Api()
dep(api).doSomething()

// test
const testApi = new Api()
dep.register(testApi, /* */)
```

But your runtime code will still work just fine, and your test will still throw an error to inform you that there was a missing mock.

In such cases, you can give the dependency a custom name:

```typescript
// code
const api = new Api()
dep('Api', api).doSomething()

// test
const testApi = new Api()
dep.register('Api', testApi)
```

## Things you can mock

Absolutely anything! While it's recommended to only mock what is necessary, the library doesn't hinder you in any way.

```typescript
// in code
const retryDelay = dep('retry delay', 10_000)

// in test
dep.register('retry delay', 1)

// all of this works too:
dep(Api) // to inline it: new (dep(API))()
dep('api', new Api)
dep('download', new Api().download)
dep('checks', [0, 2, 4, 8])
```

## Skip mocking

Mocks are required by default. If you have tests that need something mocked only sometimes, you can disable the mocking requirement in a test like this:

```javascript
it('...', async () => {
  dep.allow('api')
  dep.allow(fetch)

  // can now execute code without providing mock for api and fetch
  await doSomething()
})
```

## Code Injection (experimental)

One downside of using "dep()" is needing to apply it each time you interact with the dependency.

But we can make dependencies auto-injectable to go from:

```javascript
function getRandomFact() {
  const cachedFact = dep(redis).get('cats:fact') // 👈 dep() here
  if (cachedFact) {
    return cachedFact
  }
  const { fact } = await dep(fetch)('https://catfact.ninja/fact') // 👈 dep() here
  dep(redis).set('cats:fact', fact) // 👈 dep() here
  return fact
}
```

to this:

```javascript
function getRandomFact() {
  dep.injectable({redis, fetch}) // 👈 This is the only change you need to do
  const cachedFact = redis.get('cats:fact')
  if (cachedFact) {
    return cachedFact
  }
  const { fact } = await fetch('https://catfact.ninja/fact')
  redis.set('cats:fact', fact)
  return fact
}
```

To make this work, add the transformer to your configuration file.

#### jest

Add the following to your package.json or the respective code to your jest config file:

```json
{
  "jest": {
    "transform": {
      "^.+\\.js$": "mockzen/transformers/jest"
    }
  }
}
```

You can also alias fields to register dependencies.

```javascript
dep.injectable({ MyService })

const apiClient = MyService.createApiClient()
dep.injectable({ 'apiAlias': apiClient }) // 👈 see how you can call dep.injectable multiple times as well.
```

Then in your tests, you can register mocks like this:

```javascript
dep.register(MyService, MyServiceMock)
dep.register('apiAlias', MyServiceMock)
```

## Testing Utilities

Generally, you can just have custom code to record when a function was called, how many times it was called, what arguments it used, etc.

```typescript
let apiCalled = false

async function fakeCallApi() {
  apiCalled = true
  return true
}
dep.register(callApi, fakeCallApi)

await someCode()

expect(apiCalled).toBe(true)
```

But we can simplify this using the fake API:

```typescript
const fakeCallApi = dep.fake(async () => true) // returns the promised value when called
dep.register(callApi, fakeCallApi)

await someCode()

expect(fakeCallApi.called).toBe(true)
```

### fake

You can create a fake function like this:

```typescript
const fakeApi = dep.fake() // returns undefined when called
const fakeApi = dep.fake(() => true) // returns true when called
const fakeApi = dep.fake(async () => true) // returns a promised value when called
```

Next, register this fake function and use it in your assertions:

```typescript
const fakeApi = dep.fake()
dep.register(callApi, fakeApi)

await doTheThing()

expect(fakeApi.called).toBe(true)
expect(fakeApi.callCount).toBe(1)
expect(fakeApi.firstCall.firstArg).toEqual('https://...')
```

You can access different calls through the following fields:

- calls: an array of all calls
- firstCall: holds details of the first call to the function
- secondCall: holds details of the second call to the function
- lastCall: holds details of the last call to the function

Each call has the following properties:

- args: an array of arguments used to call the function
- firstArg: the first argument
- secondArg: the second argument
- lastArg: the last argument

## Emptying the registry

```typescript
dep.reset()
```

## Writing library code

If you are writing a library that will be integrated into other applications, create your own registry to not interfere with the application code:

```typescript
// dep.js
import { createRegistry } from 'mockzen'
export const dep = createRegistry()
// now import and use this version of "dep" where ever you need it!
```

Note that the environment variable `MOCKZEN_TEST_ENV` does not affect custom registries. This is again so they don't interfere with application code. Please use the explicit `dep.enableTestEnv()`!

## Use Cases

### Assert function was called

```typescript
const { dep } = require('mockzen')
const { callApi } = require('services/api')

it('will ...', async () => {
  const fakeApi = dep.fake()
  dep.register(callApi, fakeApi)
  
  await doTheThing()

  expect(fakeApi.called).toBe(true)
})
```

### Mock a (static) class method

```typescript
const fakeApi = dep.fake()
class FakeClass {
  callApi = fakeApi
}
dep.register(RealClass, FakeClass)
```

### Return different mocks depending on the amount of times called

You also have the meta information available inside the callback for such scenarios!

```typescript
const fakeFetch = dep.fake(() => {
  if (fakeFetch.callCount === 1) {
    // return for first function call
  }
  // return for subsequent function calls
})
dep.register(fetch, fakeFetch)
```

#### Return different mocks depending on the input arguments:

There is no special function for this, but it's straight forward to write your own:

```typescript
async function fakeFetch(url) {
  if (url.endsWith('/user')) {
    // return ...
  }
  // return ...
}

dep.register(fetch, fakeFetch)
```

### Validate the input arguments

```typescript
it('will get a random fact', () => {
  const fakeFetch = dep.fake()
  dep.register(fetch, fakeFetch)

  getVideo()
  
  expect(fakeFetch.firstCall.firstArg).toEqual('http://...')
})
```
