module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.dist.json',
    },
  },
  modulePathIgnorePatterns: ['<rootDir>/lib/'],
}
