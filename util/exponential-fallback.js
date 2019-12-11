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

let fetch = require('node-fetch').default;
let util = require('util');

function exponentialFallback(url, options={}, retryCount) {
    retryCount = retryCount || 0;

    // simple: return a Promise that waits exponentially
    // for retryCount = 0, you would wait 100 ms (2^0 * 100 = 100), relatively immediate
    return new Promise((resolve, reject) => {

        if (retryCount > MAX_RETRIES) {
            return reject(util.format('Maximum number of retries (%s) reached for %s', MAX_RETRIES, JSON.stringify(urlOrOptions)));
        }

        const timeout = Math.pow(2, retryCount) * RETRY_COUNT_MULTIPLIER_MS;
        if (timeout >= MAX_WAIT_INTERVAL_MS) {
            return reject(util.format('Maximum wait interval of %s milliseconds reached for %s', MAX_WAIT_INTERVAL_MS, JSON.stringify(urlOrOptions)));
        }

        setTimeout(() => {
          // console.log('Waiting %s ms (retryCount %s)', timeout, retryCount);
          exponentialFallbackHelper(url, options, retryCount)
            .then(resolve)
            .catch(reject)
        }, timeout)
    });
}

function exponentialFallbackHelper(url, options, retryCount) {
    retryCount = retryCount || 0;

    return fetch(url, options).catch((err) => {
        console.log('Error (%s) - retry number %s', err.message, retryCount);
        return exponentialFallback(url, options, ++retryCount)
    });
}

module.exports = {
    exponentialFallback : exponentialFallback,
    MAX_RETRIES: MAX_RETRIES,
    MAX_WAIT_INTERVAL_MS: MAX_WAIT_INTERVAL_MS,
    RETRY_COUNT_MULTIPLIER_MS: RETRY_COUNT_MULTIPLIER_MS
};
