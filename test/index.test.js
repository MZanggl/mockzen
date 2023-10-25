const { dep } = require('../dist/index')

describe('fake', () => {
  it('will set initial callCount correctly', () => {
    dep.enableTestEnv()
    const fake = dep.fake(() => {
      expect(fake.callCount).toBe(1)
    })
    fake()
    expect(fake.called).toBe(true)
  })

  it('will update callCount correctly', () => {
    dep.enableTestEnv()
    const fake = dep.fake()
    fake()
    fake()
    expect(fake.callCount).toBe(2)
  })

  it('will allow accessing args through the various fields', () => {
    dep.enableTestEnv()
    const fake = dep.fake()
    fake(1, 2, 3)
    fake(4, 5, 6)
    fake(7, 8, 9)

    expect(fake.calls).toEqual([fake.firstCall, fake.secondCall,fake.lastCall])
    expect(fake.firstCall.firstArg).toBe(1)
    expect(fake.firstCall.secondArg).toBe(2)
    expect(fake.firstCall.lastArg).toBe(3)
    expect(fake.firstCall.args).toEqual([1, 2, 3])

    expect(fake.secondCall.firstArg).toBe(4)
    expect(fake.secondCall.secondArg).toBe(5)
    expect(fake.secondCall.lastArg).toBe(6)
    expect(fake.secondCall.args).toEqual([4, 5, 6])

    expect(fake.lastCall.firstArg).toBe(7)
    expect(fake.lastCall.secondArg).toBe(8)
    expect(fake.lastCall.lastArg).toBe(9)
    expect(fake.lastCall.args).toEqual([7, 8, 9])
  })
})

describe('dep', () => {
  it('will crash with a clean description when a mock was forgotten', () => {
    dep.enableTestEnv()

    function fetchApi() {}
    expect(() => dep(fetchApi)).toThrow('fetchApi not found in dependency registry')

    const api2 = () => {}
    expect(() => dep(api2)).toThrow('api2 not found in dependency registry')

    expect(() => dep(() => { const test = 1 })).toThrow(`Anonymous Function (() => { const test = 1 }) not found in dependency registry`)
    
    class MyService {}
    expect(() => dep(MyService)).toThrow('MyService not found in dependency registry')
    const service = new MyService
    expect(() => dep(service)).toThrow('Instance of MyService not found in dependency registry')
  })

  it('will not crash if name was explicitly allowed', () => {
    dep.enableTestEnv()
    
    function fetchApi() {}
    expect(() => dep(fetchApi)).toThrow('fetchApi not found in dependency registry')

    dep.allow(fetchApi)
    expect(dep(fetchApi)).toBe(fetchApi)
  })

  it('Can use fake function in dep registrations', () => {
    dep.enableTestEnv()
    function callApi() {
      return false
    }

      const fakeApi = dep.fake(() => true)
      dep.register(callApi, fakeApi)

      const response = dep(callApi)()
      expect(response).toBe(true)
      expect(fakeApi.called).toBe(true)
  })

  it('can mock and intercept class methods', () => {
    dep.enableTestEnv()

    // the test
    const fakeQueryMethod = dep.fake()
    class FakeQueryService {
      query = fakeQueryMethod
    }

    // the code
    class RealQueryService {
      query(sql) {}
    }

    // the test
    dep.register(RealQueryService, FakeQueryService);

    // the code
    new (dep(RealQueryService))().query()

    expect(fakeQueryMethod.callCount).toBe(1)
  })

  it('can return different results depending on how many times the function was called', () => {
    dep.enableTestEnv()
    
    const fakeMethod = dep.fake(function(letter) {
      if (fakeMethod.callCount === 1) return letter + 1
      return letter + 2
    })

    expect(fakeMethod('a')).toBe('a1')
    expect(fakeMethod('b')).toBe('b2')
  })
})

function test() {
  dep.injectable({ fetch })
  return fetch('http://')
}

describe('dependency code injection', () => {
  beforeEach(() => {
    dep.reset()
  })
  
  it('will throw error if the code injection did not take place', () => {
    dep.enableTestEnv()

    expect(() => test()).toThrow('Code transformation was not implemented. Please check the README of mockzen again!')
  })
})