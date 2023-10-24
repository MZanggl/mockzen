const { dep } = require('../dist/index')

function test() {
  dep.injectable({ fetch })
  return fetch('http://')
}

describe('dep injection code', () => {
  it('can inject dependencies automatically', () => {
    dep.enableTestEnv()

    expect(test.toString()).toContain('_mockzenInjected1.fetch')
    expect(() => test()).toThrow('fetch not found in dependency registry')

    const fakefetch = dep.fake()
    dep.register(fetch, fakefetch)
    test()
    expect(fakefetch.called).toBe(true)
  })
})