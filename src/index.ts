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

  function dep<T>(name: any, symbol: T): T;
  function dep<T>(name: T): T;
  function dep<T>(name: any, symbol = name) {
    if (!dep.enabled) {
      return symbol;
    }

    if (registry.has(name)) {
      return registry.get(name).symbol;
    }

    throw new Error(`${getSymbolName(name)} not found in dependency registry`);
  }

  dep.enabled = false;

  dep.enable = function () {
    dep.enabled = true;
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
  };

  return dep;
}

// default dep
export const dep = createRegistry();
dep.enabled = [true, 1, "1"].includes(process.env.MOCKZEN_TEST_ENV);
