const { dep } = require('../dist/index')

function test() {
  dep.injectable({ fetch })
  return fetch('http://')
}

function testWithAlias() {
  dep.injectable({ 'hey-test': fetch })
  return fetch('http://')
}

describe('dep injection code', () => {
  it('can inject dependencies using aliases', () => {
    dep.enableTestEnv()

    expect(testWithAlias.toString()).toContain(`_mockzenInjected2['hey-test']`)
    expect(() => testWithAlias()).toThrow('hey-test not found in dependency registry')

    const fakefetch = dep.fake()
    dep.register('hey-test', fakefetch)
    testWithAlias()
    expect(fakefetch.called).toBe(true)
  })

  it('can inject dependencies automatically', () => {
    dep.enableTestEnv()

    expect(test.toString()).toContain(`_mockzenInjected1['fetch']`)
    expect(() => test()).toThrow('fetch not found in dependency registry')

    const fakefetch = dep.fake()
    dep.register('fetch', fakefetch)
    test()
    expect(fakefetch.called).toBe(true)
  })
})