function getSymbolName(name: any) {
  if (typeof name === "string") return name;

  if (name?.constructor?.toString().startsWith("class ")) {
    return `Instance of ${name.constructor.name}`;
  }
  if (typeof name === "function" && name.name.trim()) return name.name;
  if (typeof name === "function") return `Anonymous Function (${name.toString().split('\n').slice(0, 4).join('\n')})`;
  return name;
}

export function createRegistry() {
  let registry = new Map();
  let allowedList = [];

  function dep<T>(name: any, symbol: T): T;
  function dep<T>(name: T): T;
  function dep<T>(name: any, symbol = name) {
    if (!dep.testEnvEnabled) {
      return symbol;
    }

    if (registry.has(name)) {
      return registry.get(name).symbol;
    }
    if (registry.has(symbol)) {
      return registry.get(symbol).symbol;
    }

    if (allowedList.includes(name)) {
      return symbol
    }

    throw new Error(`${getSymbolName(name)} not found in dependency registry`);
  }

  dep.multi = (deps: Object) => {
    const withDeps = {}
    Object.keys(deps).forEach(key => {
      withDeps[key] = dep(key, deps[key])
    })
    return withDeps
  }

  dep.testEnvEnabled = false;

  /**
   * Makes the variables yo uspecify as arguments testable/
   */
  dep.injectable = (...args: any[]) => {
    if (dep.testEnvEnabled) {
      throw new Error('Code transformation was not implemented. Please check the README of mockzen again!')
    }
  }

  dep.enableTestEnv = function () {
    dep.testEnvEnabled = true;
  };

  function getCallArgs(args: any[]) {
    return {
      args,
      firstArg: args[0],
      secondArg: args[1],
      lastArg: args[args.length - 1],
    };
  }
  dep.fake = function (callback?: Function) {
    function fakeFunction(...args) {
      fakeFunction.called = true;
      fakeFunction.callCount++;
      fakeFunction.calls.push(getCallArgs(args));
      fakeFunction.lastCall = getCallArgs(args)
      if (fakeFunction.callCount === 1) fakeFunction.firstCall = getCallArgs(args)
      if (fakeFunction.callCount === 2) fakeFunction.secondCall = getCallArgs(args)

      return callback?.(...args);
    }

    fakeFunction.__isMockzenFake = true
    fakeFunction.called = false;
    fakeFunction.callCount = 0;
    fakeFunction.calls = [];
    fakeFunction.firstCall = getCallArgs([])
    fakeFunction.secondCall = getCallArgs([])
    fakeFunction.lastCall = getCallArgs([])
    return fakeFunction;
  };

  dep.register = function (name, symbol) {
    const dependency = { symbol };
    registry.set(name, dependency);
  };

  dep.reset = function () {
    registry = new Map();
    allowedList = [];
  };

  dep.allow = function(name) {
    allowedList.push(name);
  }

  return dep;
}

// default dep
export const dep = createRegistry();
dep.testEnvEnabled = ['true', true, 1, "1"].includes(process.env.MOCKZEN_TEST_ENV);
