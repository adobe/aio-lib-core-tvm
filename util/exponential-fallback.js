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

const MAX_RETRIES = 5
const MAX_WAIT_INTERVAL_MS = 1 * 60 * 1000 // 1 minute in milliseconds
const RETRY_COUNT_MULTIPLIER_MS = 100

const logger = require('@adobe/aio-lib-core-logging')('@adobe/aio-lib-core-tvm', { provider: 'debug' })
const fetch = require('node-fetch').default
const util = require('util')
const sleep = util.promisify(setTimeout)

/**
 * This function will retry connecting to a url end-point, with
exponential fallback. Returns a Promise.
 *
 * @param {string} url endpoint url
 * @param {object} options request options
 * @param {number} retryCount retry count
 * @param {object} err error response
 * @returns {Promise} Promise object representing the http response
 */
async function exponentialFallback (url, options, retryCount, err) {
  retryCount = retryCount || 0

  // simple: return a Promise that waits exponentially
  // for retryCount = 0, you would wait 100 ms (2^0 * 100 = 100), relatively immediate

  if (retryCount > MAX_RETRIES) {
    logger.debug(util.format('Maximum number of retries (%s) reached for %s', MAX_RETRIES, JSON.stringify(url)))
    return err
  }

  const timeout = Math.pow(2, retryCount) * RETRY_COUNT_MULTIPLIER_MS
  logger.debug(`Waiting ${timeout} ms (retryCount ${retryCount})`)
  await sleep(timeout)
  return _exponentialFallbackHelper(url, options, retryCount)
}

/**
 * Helper function
 *
 * @param {string} url endpoint url
 * @param {object} options request options
 * @param {number} retryCount retry count
 * @returns {object} http response
 * @private
 */
async function _exponentialFallbackHelper (url, options, retryCount) {
  retryCount = retryCount || 0

  const response = await fetch(url, options)
  if (response.ok || (response.status < 500 || response.status > 599)) {
    return response
  }
  logger.debug(`Error response with status (${response.status}) - retry number ${retryCount}`)
  return exponentialFallback(url, options, ++retryCount, response)
}

module.exports = {
  exponentialFallback: exponentialFallback,
  MAX_RETRIES: MAX_RETRIES,
  MAX_WAIT_INTERVAL_MS: MAX_WAIT_INTERVAL_MS,
  RETRY_COUNT_MULTIPLIER_MS: RETRY_COUNT_MULTIPLIER_MS
}
