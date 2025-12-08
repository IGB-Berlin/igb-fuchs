const fs = require('fs')
const { Validator } = require('@cfworker/json-schema')

// Simple Node.js script to validate JSON files against a schema, for example:
// find <PATH> -iname '*.json' -exec node dev/validator.cjs src/types/igb-fuchs.schema.json '{}' +

const args = process.argv.slice(2)  // exclude 'node' and this script's path

if (args.length < 2) {
  console.log(`Usage: node validator.cjs SCHEMA.JSON DATA.JSON ...`)
  process.exit(1)
}

const validator = new Validator(JSON.parse(fs.readFileSync(args[0], 'utf8')), null, false)

args.slice(1).forEach(path => {
  const result = validator.validate(JSON.parse(fs.readFileSync(path, 'utf8')))
  if (result.valid) console.log(`✅ ${path}`)
  else {
    console.log(`❌ ${path}`)
    result.errors.forEach( (err,i) => {
      console.log(`  ${i+1}. Path: ${err.instanceLocation}`)
      console.log(`     Error: ${err.error}`)
    })
  }
})
