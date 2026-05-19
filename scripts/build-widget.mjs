import * as esbuild from 'esbuild'

const watch = process.argv.includes('--watch')

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
  const result = await esbuild.build({ ...buildOptions, metafile: true })
  const jsSize = Object.values(result.metafile.outputs)[0]?.bytes ?? 0
  console.log(`widget.js   ${(jsSize / 1024).toFixed(1)}kb`)
}
