/**
 * Copyright 2013 the PM2 project authors. All rights reserved.
 * Use of this source code is governed by a license that
 * can be found in the LICENSE file.
 */

process.env.PM2_PROGRAMMATIC = 'true';

var API = require('./lib2/API/index.js');

module.exports = API();
module.exports.custom = API;
