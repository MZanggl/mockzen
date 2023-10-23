function process (src, filename) {
  const injectionStart = 'dep.injectable'
  const modifiedCode = src.split('\r\n')
    .map(line => {
      if (line.trim().startsWith(injectionStart)) {
        const deps = line.trim().substring(injectionStart.length + 1, line.trim().length - 1).trim().split(',').map(dep => dep.trim())
        return deps.map(dep => `${dep} = dep(${dep})`).join('; ')
      }
      return line
    }).join('\r\n')

  return {
    code: modifiedCode,
  };
}

module.exports = { process }