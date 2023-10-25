const { dep } = require('../dist/index')

function test() {
  dep.injectable({ fetch })
  return fetch('http://')
}

function wrapped() {
  return test()
}

function testWithAlias() {
  dep.injectable({ 'hey-test': fetch })
  return fetch('http://')
}

describe('dep injection code', () => {
  beforeEach(() => {
    dep.reset()
  })
  
  it('can inject dependencies using aliases', () => {
    dep.enableTestEnv()

    expect(testWithAlias.toString()).toContain(`_mockzenInjected2['hey-test']`)
    expect(() => testWithAlias()).toThrow('hey-test not found in dependency registry')

    const fakefetch = dep.fake()
    dep.register('hey-test', fakefetch)
    testWithAlias()
    expect(fakefetch.called).toBe(true)
  })

  it('can inject dependencies automatically using name or reference to symbol', () => {
    dep.enableTestEnv()

    expect(test.toString()).toContain(`_mockzenInjected1['fetch']`)
    expect(() => test()).toThrow('fetch not found in dependency registry')

    let fakefetch = dep.fake()
    dep.register('fetch', fakefetch)
    test()
    expect(fakefetch.called).toBe(true)

    dep.reset()
    fakefetch = dep.fake()
    dep.register(fetch, fakefetch)
    test()
    expect(fakefetch.called).toBe(true)
  })

  it('can inject dependencies automatically in nested functions', () => {
    dep.enableTestEnv()

    expect(() => wrapped()).toThrow('fetch not found in dependency registry')

    const fakefetch = dep.fake()
    dep.register('fetch', fakefetch)
    wrapped()
    expect(fakefetch.called).toBe(true)
  })
})