/** @type {import('jest').Config} */
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['./jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@expo/vector-icons/(.*)$': '<rootDir>/src/__mocks__/expoVectorIcons.tsx',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      { tsconfig: { jsx: 'react-jsx', esModuleInterop: true, paths: { '@/*': ['src/*'] }, typeRoots: ['src/__mocks__', 'node_modules/@types'] } },
    ],
  },
  transformIgnorePatterns: [
    // handles both npm/yarn flat layout and pnpm's nested .pnpm/<pkg@version>/node_modules/<pkg> layout
    'node_modules/(?!(.pnpm/.+?/node_modules/)?(react-native|@react-native|@react-native-async-storage|react-native-reanimated|react-native-gesture-handler|react-native-safe-area-context|expo|@expo|react-native-audio-api)/)',
  ],
  testMatch: ['**/__tests__/**/*.test.ts?(x)'],
};
