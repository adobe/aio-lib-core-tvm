/*
Copyright 2019 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

const { ErrorWrapper, createUpdater } = require('@adobe/aio-lib-core-errors').AioCoreSDKErrorWrapper
const logger = require('@adobe/aio-lib-core-logging')('@adobe/aio-lib-core-tvm', { provider: 'debug' })

// TODO find a better way to jsdoc error types
/**
 * @typedef TvmLibError
 * @private
 *
 */
/**
 * Tvm lib custom errors
 *
 * @typedef TvmLibErrors
 * @type {object}
 * @property {TvmLibError} ERROR_BAD_ARGUMENT this error is thrown when an argument is missing or has invalid type
 * @property {TvmLibError} ERROR_RESPONSE this error is thrown when the TVM server returns an error response
 * (e.g 401 unauthorized for missing Authorization header or 403 for bad credentials). The status can be retrieved from
 * the `e.sdkDetails.status` field and the body from `e.sdkDetails.body`
 */

const codes = {}
const messages = new Map()

const Updater = createUpdater(
  codes,
  messages
)

const E = ErrorWrapper(
  'TvmLibError',
  'TvmLib',
  Updater
)

E('ERROR_BAD_ARGUMENT', '%s')
E('ERROR_RESPONSE', 'error response from TVM server with status code: %s')
E('ERROR_MISSING_OPTION', 'missing one or more of required options: %s')

// eslint-disable-next-line jsdoc/require-jsdoc
function logAndThrow (e) {
  logger.error(JSON.stringify(e, null, 2))
  throw e
}

module.exports = {
  codes,
  messages,
  logAndThrow
}
