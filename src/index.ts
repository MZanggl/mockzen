export function createRegistry({ lookup = false } = {}) {
  let registry = new Map
  
  function dep<T>(name: any, symbol: T): T
  function dep<T>(name: T): T
  function dep<T>(name: any, symbol = name) {
    if (!lookup) {
      return symbol
    }

    if (registry.has(name)) {
      const entry = registry.get(name)

      const returnValue = entry.callback({...entry})
      entry.timesCalled++
      entry.wasCalled = true
      if (typeof returnValue === 'function') {
        return (...args) => {
          entry.arguments.push(args)
          return returnValue(...args)
        }
      }
      return returnValue
    }

    throw new Error(`${name} not found in dependency registry`)
  }

  dep.register = function(name, callback) {
    const dependency = { callback, timesCalled: 0, arguments: [], wasCalled: false }
    registry.set(name, dependency)
    return dependency
  }
  
  dep.reset = function() {
    registry = new Map
  }

  return dep
}


const dep = createRegistry()

dep(fetch)
