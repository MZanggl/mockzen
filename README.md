# Dependency Registry

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

In the tests, register a mock:

```typescript
dep.register(fetch, () => {
  return function fakeFetch(url) {
    return {
      async json() {
        return { fact: 'hey'}
      }
    }
  }
})
```

If you did not reigster the mock, your test will fail, so there's no surprise about whether you correctly mocked something or not!

## Get Started

Install:

```bash
npm install dependency-registry
```

Create your registry, and specify with `lookup` when you are in your testing environment:

```typescript
// dep.js
import { createRegistry } from 'dependency-registry'
export const dep = createRegistry({ lookup: process.env.NODE_ENV === 'test' })
// now import "dep" where ever you need it.
```

Only when "lookup" is true, it will use the registry, otherwise it will simply return the provided value again!

## Naming dependencies

You need to name dependencies that can't be looked up otherwise (when shallow comparison isn't possible):

This won't work:

```typescript
// code
dep(new Api()).doSomething()

// test
dep.register(new API(), /* */)
```

But no worries, it still won't affect your runtime code, and your test will still fail to inform you that there was a missing mock.

This will work:

```typescript
// code
const api = new Api()
dep('Api', api).doSomething()

// test
dep.register('Api', /**/)
```

Of course, `const api = new dep(Api)()` would have also worked, not requiring an explicit name.

## Things you can mock

Absolutely anything! While it's recommended to only mock what is absolutely necessary, the library doesn't hinder you in any way.

```typescript
// in code
const retryDelay = dep('retry delay', 10_000)

// in test
dep.register('retry delay', () => 1)

// all of this works too:
dep(Api)
dep('api', new Api)
dep('download', new Api().download)
dep('checks', [0, 2, 4, 8])
```

## Emptying the registry

```typescript
dep.reset()
```

## Testing Utilities

This library supports some common scenarios out of the box. For more complex scenarios or easier ways to fake classes, etc., you can integrate `sinon` with this library.

### How to know if my mock was used

```typescript
it('will get a random fact', async () => {
  const fakeFetch = dep.register(fetch, /* */)

  await getFact()

  expect(fakeFetch.wasCalled).toBe(true)
})
```

### How to return different mocks

#### Depending on the amount of times called

You also have the meta information available inside the callback for such scenarios!

```typescript
dep.register(fetch, fakeFetch => {
  if (fakeFetch.timesCalled === 0) {
    // on first call, return ...
  }
  // on subsequent calls: return ...
})
```

#### Depending on the input arguments:

```typescript
async function fakeFetch(url) {
  if (url.endsWith('/user')) {
    // return ...
  }
  // return ...
}

dep.register(fetch, () => fakeFetch)
```

### Validate the input arguments

Checking for "wasCalled" will guarantee the function was indeed called, then you can add your assertions safely within the mock!

```typescript
it('will get a random fact', () => {
  const fakeFetch = dep.register(fetch, () => {
    return async function(url) {
      expect(url).toBe('...')
      // return ...
    }
  })

  expect(fakeFetch.wasCalled).toBe(true)
})
```

You could also assign "url" to a variable that was declared outside, and then assert that at the end of your test.

Finally, for functions and methods specifically (not methods of a class instance you mocked), you can check the "arguments" like this:

```typescript
it('will get a random fact', () => {
  const fakeFetch = dep.register(fetch, () => {})

  getVideo()
  
  // [0] to access arguments of first call
  expect(fakeFetch.arguments[0]).toEqual(['http://...'])
})
```

The arguments provided get intercepted and saved. You can access each set of arguments no matter how often your mock was called, hence the two-dimensional array.
