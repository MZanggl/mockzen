const { dep } = require('../dist/index')

function test() {
  dep.injectable({ fetch })
  return fetch('http://')
}

describe('dep injection code', () => {
  beforeEach(() => {
    dep.reset()
  })
  
  it('will throw error if the code injection did not take place', () => {
    dep.enableTestEnv()

    expect(() => test()).toThrow('Code transformation was not implemented. Please check the README of mockzen again!')
  })
})