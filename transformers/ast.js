const babel = require("@babel/core");

let nsIndex = 0
function babelPlugin(babel) {
  const { types: t } = babel;

  function traverse(path, namespace, properties) {
    const referencedProperty = properties.find((prop) => t.isNodesEquivalent(prop.value, path.node));
    if (!referencedProperty) return;
    // prevent updating the key within dep.multi declaration
    const callee = path.parentPath?.parentPath?.parentPath?.node?.callee
    if (callee?.object?.name === 'dep' && callee?.property?.name === 'multi') return;
    const accessor = referencedProperty.key.name ?? referencedProperty.key.value
    const identifier = t.identifier(`${namespace}['${accessor}']`);
    path.replaceWith(identifier);
  }

  return {
    visitor: {
          CallExpression(innerPath) {
            const callee = innerPath.node.callee;
            const isInjectableExp = t.isMemberExpression(callee) && t.isIdentifier(callee.object, { name: 'dep' }) && t.isIdentifier(callee.property, { name: "injectable" })
            if (!isInjectableExp) return;
            const args = innerPath.node.arguments;
            if (!t.isObjectExpression(args[0])) return;
            const properties = args[0].properties;

            nsIndex++
            const namespace = `_mockzenInjected${nsIndex}`
            // using "var" to avoid it being wrapped in an IFEE
            const transformedExpression = t.variableDeclaration('var', [
              t.variableDeclarator(
                t.identifier(namespace),
                t.callExpression(t.memberExpression(t.identifier('dep'), t.identifier('multi')), [args[0]])
              ),
            ]);

            // Replace dep.injectable with the transformed expression
            innerPath.replaceWith(transformedExpression);

            innerPath.scope.traverse(innerPath.scope.block, {
              MemberExpression(path) {
                traverse(path, namespace, properties)
              },
              Identifier(path) {
                const propertyName = path.node.name;
                if (propertyName.startsWith(namespace)) return;
                traverse(path, namespace, properties)
              },
            });
          },
    },
  };
};

function injectDeps(src) {
  if (!src.includes('dep.injectable')) {
    return src
  }
  const { code } = babel.transformSync(src, {
    plugins: [babelPlugin],
  });
  return code
}

module.exports = { injectDeps }
