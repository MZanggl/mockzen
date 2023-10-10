export function createRegistry() {
  let registry = new Map
  let lookup = false
  
  function dep<T>(name: any, symbol: T): T
  function dep<T>(name: T): T
  function dep<T>(name: any, symbol = name) {
    if (!lookup) {
      return symbol
    }

    if (registry.has(name)) {
      return registry.get(name).symbol
    }

    throw new Error(`${name} not found in dependency registry`)
  }

  dep.enable = function() {
    lookup = true
  }

  dep.fake = function(callback?: Function) {
    function fakeFunction(...args) {
      fakeFunction.called = true
      fakeFunction.callCount++
      fakeFunction.args = [args]

      return callback?.(...args)
    }

    fakeFunction.called = false
    fakeFunction.callCount = 0
    fakeFunction.args = []
    return fakeFunction
  }

  dep.register = function(name, symbol) {
    const dependency = { symbol }
    registry.set(name, dependency)
  }
  
  dep.reset = function() {
    registry = new Map
  }

  return dep
}

// default dep
export const dep = createRegistry()