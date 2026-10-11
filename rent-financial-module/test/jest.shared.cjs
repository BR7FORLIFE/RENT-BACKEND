// Configuración compartida entre unit tests y e2e.
// El proyecto es ESM ("type": "module", imports con sufijo .js); para Jest compilamos a CJS
// y mapeamos los imports `.js` a sus fuentes .ts. Los módulos con efectos secundarios
// (cliente Prisma generado, env, config) se reemplazan por stubs de test/mocks.
const path = require('path');
const mocks = path.join(__dirname, 'mocks');

module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  testEnvironment: 'node',
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      { tsconfig: path.join(__dirname, 'tsconfig.spec.json') },
    ],
  },
  moduleNameMapper: {
    '^.*/generated/prisma/client(\\.js)?$': path.join(
      mocks,
      'prisma-client.ts',
    ),
    '^.*/config/env(\\.js)?$': path.join(mocks, 'env.ts'),
    '^.*/config/config(\\.js)?$': path.join(mocks, 'config.ts'),
    '^ollama$': path.join(mocks, 'ollama.ts'),
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
