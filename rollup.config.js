import typescript from '@rollup/plugin-typescript';

export default {
	input: 'src/index.tsx',
	output: [
		// ES module
		{
			file: 'dist/bundle.esm.js',
			format: 'esm',
		},
		// CommonJS
		{
			file: 'dist/bundle.cjs.js',
			format: 'cjs',
		},
	],
	external: ['react', 'react-dom'],
	plugins: [typescript()],
};
