import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

const PATH_REACT = 'packages/integrations-captain-react';
const PATH_UNIVERSAL = 'packages/integrations-captain';

export default [
	// itegrations-captain-react
	{
		input: `${PATH_REACT}/src/index.ts`,
		output: [
			// ES module
			{
				file: `${PATH_REACT}/dist/bundle.esm.js`,
				format: 'esm',
			},
			// CommonJS
			{
				file: `${PATH_REACT}/dist/bundle.cjs.js`,
				format: 'cjs',
			},
		],
		external: ['react', 'react-dom'],
		plugins: [
			typescript({
				tsconfig: `${PATH_REACT}/tsconfig.json`,
			}),
		],
	},
	// integration-captain
	{
		input: `${PATH_UNIVERSAL}/src/index.ts`,
		output: [
			{
				file: `${PATH_UNIVERSAL}/dist/bundle.esm.js`,
				format: 'esm',
			},
			{
				file: `${PATH_UNIVERSAL}/dist/bundle.cjs.js`,
				format: 'cjs',
			},
		],
		plugins: [
			typescript({
				tsconfig: `${PATH_UNIVERSAL}/tsconfig.json`,
			}),
			resolve({
				resolveOnly: ['.*'],
			}),
			commonjs(),
		],
	},
];
