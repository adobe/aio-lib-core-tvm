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

/* eslint-disable jsdoc/require-jsdoc */
process.on('unhandledRejection', error => {
  throw error
})

async function toThrowWithCodeAndMessageContains (received, code, words, status) {
  function checkErrorCode (e, code) {
    if (e.name !== 'TvmLibError') {
      return { message: () => `expected error to be instanceof 'TvmLibError', instead received "${e.constructor.name}" with message: "${e.message}"`, pass: false }
    }
    if (e.code !== code) {
      return { message: () => `expected error code to be "${code}", instead received "${e.code}" with message: "${e.message}"`, pass: false }
    }
    if (status && e.sdkDetails.status !== status) {
      return { message: () => `expected error with http status "${status}", instead received "${e.status}" with message: "${e.message}"`, pass: false }
    }
  }
  function checkErrorMessageContains (message, words) {
    message = message.toLowerCase()
    if (typeof words === 'string') words = [words]
    for (let i = 0; i < words.length; ++i) {
      const a = words[i].toLowerCase()
      if (message.indexOf(a) < 0) {
        return { message: () => `expected error message "${message}" to contain "${a}"`, pass: false }
      }
    }
  }
  try {
    await received()
  } catch (e) {
    let res = checkErrorCode(e, code)
    if (res) return res

    res = checkErrorMessageContains(e.message, words)
    if (res) return res

    return { pass: true }
  }
  return { message: () => 'function should have thrown', pass: false }
}
expect.extend({
  toThrowWithCodeAndMessageContains,
  toThrowBadArgWithMessageContaining: (received, words) => toThrowWithCodeAndMessageContains(received, 'ERROR_BAD_ARGUMENT', words),
  toThrowStatusError: (received, status) => toThrowWithCodeAndMessageContains(received, 'ERROR_RESPONSE', [], status)
})
