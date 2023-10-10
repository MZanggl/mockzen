const { dep } = require('../dist/index')

describe('fake', () => {
  it('will set initial callCount correctly', () => {
    dep.enable()
    const fake = dep.fake(() => {
      expect(fake.callCount).toBe(1)
    })
    fake()
    expect(fake.called).toBe(true)
  })
})

describe('Validate Use Cases from README', () => {
  it('validates "How to know if my mock was used"', () => {
    dep.enable()
    function callApi() {
      return false
    }

      const fakeApi = dep.fake(() => true)
      dep.register(callApi, fakeApi)

      const response = dep(callApi)()
      expect(response).toBe(true)
      expect(fakeApi.called).toBe(true)
  })
})

describe('Other derived examples', () => {
  it('can mock and intercept class methods', () => {
    dep.enable()

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
    const Duped = dep(RealQueryService)
    new Duped().query()

    expect(fakeQueryMethod.callCount).toBe(1)
  })

  it('can execute different code depending on how many times it was called', () => {
    dep.enable()
    
    const fakeMethod = dep.fake(function(letter) {
      console.log(fakeMethod.callCount)
      if (fakeMethod.callCount ===1) return letter + 1
      return letter + 2
    })

    expect(fakeMethod('a')).toBe('a1')
    expect(fakeMethod('b')).toBe('b2')
  })



})