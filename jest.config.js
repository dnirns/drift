/** @type {import('jest').Config} */
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['./jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      { tsconfig: { jsx: 'react-jsx', esModuleInterop: true, paths: { '@/*': ['src/*'] } } },
    ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-native-async-storage|react-native-reanimated|react-native-gesture-handler|react-native-safe-area-context|expo|@expo|react-native-audio-api)/)',
  ],
  testMatch: ['**/__tests__/**/*.test.ts?(x)'],
};
