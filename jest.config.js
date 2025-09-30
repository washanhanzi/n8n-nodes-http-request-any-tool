module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	testMatch: ['**/nodes/**/*.test.ts'],
	testPathIgnorePatterns: ['/node_modules/', '/dist/', '/ref/'],
	collectCoverageFrom: [
		'nodes/**/*.ts',
		'!nodes/**/*.node.ts',
		'!nodes/**/test/**',
		'!nodes/**/descriptions.ts',
	],
	coverageReporters: ['text', 'lcov', 'html'],
	transform: {
		'^.+\\.ts$': [
			'ts-jest',
			{
				isolatedModules: true,
			},
		],
	},
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/nodes/$1',
	},
	setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};