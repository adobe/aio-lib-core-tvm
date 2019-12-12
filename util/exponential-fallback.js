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

"use strict";
const MAX_RETRIES = 5;
const MAX_WAIT_INTERVAL_MS = 1 * 60 * 1000; // 1 minute in milliseconds
const RETRY_COUNT_MULTIPLIER_MS = 100;

const logger = require('@adobe/aio-lib-core-logging')('@adobe/aio-lib-core-tvm', { provider: 'debug' })
const fetch = require('node-fetch').default;
const util = require('util');

/**
 * This function will retry connecting to a url end-point, with
 * exponential fallback. Returns a Promise.
 * 
 * @param {string} url endpoint url
 * @param {object} options request options
 * @param {number} retryCount retry count
 * @returns {Promise} Promise object representing the http response
 */
function exponentialFallback(url, options={}, retryCount, err) {
    retryCount = retryCount || 0;

    // simple: return a Promise that waits exponentially
    // for retryCount = 0, you would wait 100 ms (2^0 * 100 = 100), relatively immediate
    return new Promise((resolve, reject) => {

        if (retryCount > MAX_RETRIES) {
            logger.debug(util.format('Maximum number of retries (%s) reached for %s', MAX_RETRIES, JSON.stringify(url)))
            return reject(err);
        }

        const timeout = Math.pow(2, retryCount) * RETRY_COUNT_MULTIPLIER_MS;
        if (timeout >= MAX_WAIT_INTERVAL_MS) {
            logger.debug(util.format('Maximum wait interval of %s milliseconds reached for %s', MAX_WAIT_INTERVAL_MS, JSON.stringify(url)))
            return reject(err);
        }

        setTimeout(() => {
          logger.debug(`Waiting ${timeout} ms (retryCount ${retryCount})`);
          exponentialFallbackHelper(url, options, retryCount)
            .then(resolve)
            .catch(reject)
        }, timeout)
    });
}

function exponentialFallbackHelper(url, options, retryCount) {
    retryCount = retryCount || 0;

    return fetch(url, options).catch((err) => {
        logger.debug(`Error (${err.message}) - retry number ${retryCount}`);
        return exponentialFallback(url, options, ++retryCount, err)
    });
}

module.exports = {
    exponentialFallback : exponentialFallback,
    MAX_RETRIES: MAX_RETRIES,
    MAX_WAIT_INTERVAL_MS: MAX_WAIT_INTERVAL_MS,
    RETRY_COUNT_MULTIPLIER_MS: RETRY_COUNT_MULTIPLIER_MS
};
