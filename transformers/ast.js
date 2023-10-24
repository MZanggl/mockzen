const babel = require("@babel/core");


let nsIndex = 0
function babelPlugin(babel) {
  const { types: t } = babel;
  console.log('call babel')
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
              Identifier(idPath) {
                const propertyName = idPath.node.name;
                if (propertyName.startsWith(namespace)) return;
                const isInjectable = properties.some(prop => t.isIdentifier(prop.key, { name: propertyName } ))
                if (!isInjectable) return;
                // prevent updating the key within dep.multi declaration
                const callee = idPath.parentPath?.parentPath?.parentPath?.node?.callee
                if (callee?.object?.name === 'dep' && callee?.property?.name === 'multi') return;
                const identifier = t.identifier(`${namespace}.${propertyName}`);
                idPath.replaceWith(identifier);
              },
            });
          },
        // });
      // },
    },
  };
};

function injectDeps(src) {
  const { code } = babel.transformSync(src, {
    plugins: [babelPlugin],
  });
  return code
}

module.exports = { injectDeps }
