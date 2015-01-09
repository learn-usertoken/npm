var util = require('util')
var path = require('path')
var validate = require('aproba')
var clone = require('lodash.clonedeep')
var npm = require('./npm.js')
var Installer = require('./install.js').Installer

module.exports = dedupe
module.exports.Deduper = Deduper

dedupe.usage = "npm dedupe"

function dedupe (args,  cb) {
  validate("AF", arguments)
  // the /path/to/node_modules/..
  var where = path.resolve(npm.dir, '..')
  var dryrun = false
  if (npm.command.match(/^find/)) dryrun = true
  if (npm.config.get('dry-run')) dryrun = true

  new Deduper(where, dryrun).run(cb)
}

function Deduper (where, dryrun) {
  validate("SB", arguments)
  Installer.call(this, where, dryrun, [])
}
util.inherits(Deduper, Installer)

Deduper.prototype.cloneCurrentTreeToIdealTree = function (cb) {
  validate('F', arguments)
  this.idealTree = clone(this.currentTree)
  this.idealTree.children = this.idealTree.children.filter(function(child) {
    // don't potentially remove things from older npms that are at the top level
    if (!child.package._requiredBy) return true
    // don't potentially remove things the user installed that aren't in the package.json
    if (child.package._requiredBy.filter(function(req){ return req === "#USER" }).length) return true
    // otherwise it's fair game
    return false
  })
  // we clear any children's children so that we can reconsider where those deps should go
  this.idealTree.children.forEach(function(child) {
    child.children = []
  })
  cb()
}
