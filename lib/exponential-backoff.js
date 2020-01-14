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

const DEFAULT_MAX_RETRIES = 5
const DEFAULY_RETRY_MULTIPLIER_MS = 100
const DEFAULT_RETRY_COUNT = 0

const logger = require('@adobe/aio-lib-core-logging')('@adobe/aio-lib-core-tvm', { provider: 'debug' })
const fetch = require('node-fetch').default
const util = require('util')
const sleep = util.promisify(setTimeout)

/**
 * This function will retry connecting to a url end-point, with
exponential backoff. Returns a Promise.
 *
 * @param {string} url endpoint url
 * @param {object} requestOptions request options
 * @param {object} retryOptions retry options with keys being maxRetries and retryMultipler
 * @returns {Promise} Promise object representing the http response
 */
async function exponentialBackoff (url, requestOptions, retryOptions) {
  const {
    maxRetries = DEFAULT_MAX_RETRIES,
    retryMultiplier = DEFAULY_RETRY_MULTIPLIER_MS
  } = retryOptions
  return _exponentialBackoffHelper(url, requestOptions, { maxRetries, retryMultiplier })
}

/**
 * Helper function
 *
 * @param {string} url endpoint url
 * @param {object} requestOptions request options
 * @param {number} retryOptions retry options with keys being maxRetries, retryMultipler and retryCount
 * @returns {object} http response
 * @private
 */
async function _exponentialBackoffHelper (url, requestOptions, retryOptions) {
  const { maxRetries, retryMultiplier, retryCount = DEFAULT_RETRY_COUNT } = retryOptions

  const response = await fetch(url, requestOptions)
  if (response.ok || (response.status < 500 || response.status > 599)) {
    return response
  }
  logger.debug(`Error response with status (${response.status}) - retry number ${retryCount}`)

  if (retryCount + 1 > maxRetries) {
    logger.debug(util.format('Maximum number of retries (%s) reached for %s', maxRetries, url))
    return response
  }

  const timeout = Math.pow(2, retryCount) * retryMultiplier
  logger.debug(`Waiting ${timeout} ms (retryCount ${retryCount + 1})`)
  await sleep(timeout)

  retryOptions.retryCount = retryCount + 1
  return _exponentialBackoffHelper(url, requestOptions, retryOptions)
}

module.exports = {
  exponentialBackoff: exponentialBackoff
}
