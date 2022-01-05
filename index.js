'use strict';

var logentries = require('r7insight_node'),
  Stream = require('stream').Stream,
  util = require('util'),
  LBS;

exports.LogentriesBunyanStream = LogentriesBunyanStream;
exports.createStream = function (config, options) {
  return new LogentriesBunyanStream(config, options);
};

/**
 * LogentriesBunyanStream
 *
 * @param {Object} config Logentries config
 * @param {String} config.token
 * @param {Function} [config.transform] transforms every log
 * @param {String} [config.defaultLevel] (defaults to `info`)
 */

function LogentriesBunyanStream(config, options) {
  if (!config || !config.token) throw new Error('config.token must be set');
  Stream.call(this);

  this.transform = options && options.transform;
  this.defaultLevel = options && options.defaultLevel || 'info';
  this.writable = true;

  config.levels = config.levels || ['debug', 'info', 'notice', 'warning', 'err', 'crit', 'alert', 'emerg'];
  config.region = config.region || 'eu'; // Hardcoded value is specific too our requirement
  this._logger = new logentries(config);
}

util.inherits(LogentriesBunyanStream, Stream);
LBS = LogentriesBunyanStream.prototype;

LBS.write = function (rec) {
  if (!rec) throw new Error('nothing passed to log');
  if (!this.writable) throw new Error('failed to write to a closed stream');
  if ('function' === typeof this.transform) rec = this.transform(rec);
  this._logger.log(this._resolveLevel(rec.level), rec);
};

LBS.end = function (rec) {
  if (arguments.length) this.write(rec);
  this.writable = false;
  this._logger.end();
};

LBS.destroy = function () {
  this.writable = false;
};

LBS._resolveLevel = function (bunyanLevel) {
  var levelToName = {
    10: 'trace',
    20: 'debug',
    30: 'info',
    40: 'warn',
    50: 'error',
    60: 'fatal'
  };
  return levelToName[bunyanLevel] || this.defaultLevel;
};
