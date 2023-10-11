# mockzen

<!-- TODO: FIX REUSE IN NPM LIBS. MY SOLUTION DOESN"T WORK! -->

## Introduction

Easily mock any dependencies in your code during testing

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

During runtime, both pieces of code will behave the same!

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

In the global setup of your tests, turn on the requirement for mocks like this:
```typescript
import { dep } from 'mockzen'

dep.enableTestEnv()
```

Alternatively, you can set the environment variable `MOCKZEN_TEST_ENV` to `true` or `1` for test runners like jest.

If you want to verify that dep is indeed looking up dependencies, you can do so like this in your tests:

```typescript
expect(dep.testEnvEnabled).toBe(true)
```

## Naming dependencies

There is no need to name dependencies that are functions or classes. For example:

```typescript
dep(SomeService)
dep(someFunction)
```

But you need to name dependencies that can't be looked up using shallow comparison:

This won't work as expected:

```typescript
// code
dep(new Api()).doSomething()

// test
dep.register(new API(), /* */)
```

But no worries, it still won't affect your runtime code, and your test will still fail to inform you that there was a missing mock.

Give it a name to allow mocking it:

```typescript
// code
const api = new Api()
dep('Api', api).doSomething()

// test
dep.register('Api', /**/)
```

## Things you can mock

Absolutely anything! While it's recommended to only mock what is absolutely necessary, the library doesn't hinder you in any way.

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

## Testing Utilities

Generally, you can just have custom code to record when a function was called, how many times it was called, what arguments it used, etc.
But we can simplify this using the fake API.

### fake

You can create a fake function like this:

```typescript
const fakeApi = dep.fake() // returns undefined
const fakeApi = dep.fake(() => true) // make it return any value you want
const fakeApi = dep.fake(async () => true) // make it return a promised value
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
