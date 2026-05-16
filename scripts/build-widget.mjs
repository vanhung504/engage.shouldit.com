import * as esbuild from 'esbuild'
import postcss from 'postcss'
import tailwind from '@tailwindcss/postcss'
import { readFileSync, writeFileSync } from 'fs'

const watch = process.argv.includes('--watch')

async function compileCss() {
  const src = readFileSync('src/widget/widget.css', 'utf8')
  const result = await postcss([tailwind]).process(src, { from: 'src/widget/widget.css' })
  return result.css
}

const buildOptions = {
  entryPoints: ['src/widget/index.ts'],
  bundle:      true,
  minify:      !watch,
  outfile:     'public/widget.js',
  target:      'es2018',
  format:      'iife',
}

if (watch) {
  const ctx = await esbuild.context(buildOptions)
  await ctx.watch()
  console.log('Watching widget…')
} else {
  const [result] = await Promise.all([
    esbuild.build({ ...buildOptions, metafile: true }),
    compileCss().then(css => writeFileSync('public/widget.css', css)),
  ])
  const jsSize  = Object.values(result.metafile.outputs)[0]?.bytes ?? 0
  const cssSize = readFileSync('public/widget.css').length
  console.log(`widget.js   ${(jsSize  / 1024).toFixed(1)}kb`)
  console.log(`widget.css  ${(cssSize / 1024).toFixed(1)}kb`)
}
