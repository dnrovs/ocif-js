import typescript from '@rollup/plugin-typescript'
import commonjs from '@rollup/plugin-commonjs'
import copy from 'rollup-plugin-copy'

import { dts } from 'rollup-plugin-dts'

export default [
    {
        input: 'src/index.ts',
        output: [
            { file: 'dist/index.js', format: 'es' },
            { file: 'dist/index.cjs', format: 'cjs' }
        ],
        plugins: [
            typescript(),
            commonjs(),
            copy({ targets: [{ src: 'src/unscii.hex', dest: 'dist' }] })
        ],
        external: ['fs', 'path', 'node:path', 'node:url', 'pngjs']
    },

    {
        input: 'src/index.ts',
        output: {
            file: 'dist/index.d.ts',
            format: 'es'
        },
        plugins: [dts()]
    }
]
