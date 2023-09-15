import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import pkg from './package.json' assert { type: 'json' };
import dts from 'rollup-plugin-dts';

/** @type {import('rollup').RollupOptions} */
const options = [
	{
		input: 'src/index.ts',
		output: [{
			format: 'esm',
			file: pkg.module,
			sourcemap: true,
		}, {
			format: 'cjs',
			file: pkg.main,
			sourcemap: true,
		}, {
			name: pkg['umd:name'] || pkg.name,
			format: 'umd',
			file: pkg.unpkg,
			sourcemap: true,
			plugins: [
				terser()
			]
		}],
		external: [
			...require('module').builtinModules,
			...Object.keys(pkg.dependencies || {}),
		],
		plugins: [
			resolve(),
			// The dts plugin will handle exporting all types in a single dts file, so we do not need to export the declarations in this case
			typescript({
				declaration: false,
			})
		]
	},
	{
		input: "src/index.ts",
		output: [{ file: "dist/index.d.ts", format: "es" }],
		plugins: [dts.default()],
	  },
]
export default options;