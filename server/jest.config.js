module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.js'],
  collectCoverageFrom: [
    'server/**/*.js',
    '!server/server.js',
    '!server/config/**/*.js'
  ],
  coverageDirectory: 'coverage/backend'
}; 