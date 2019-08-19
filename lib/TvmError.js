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

/**
 * @class TvmError
 * @classdesc Token Vending Machine Client Errors
 * @hideconstructor
 * @augments Error
 */
class TvmError extends Error {
  /**
   * Creates an instance of TvmError.
   *
   * @param {string} message error message
   * @param {TvmError.codes} code Storage Error code
   * @param {number} [status] status code in case of request error
   * @memberof TvmError
   */
  constructor (message, code, status) {
    message = `[${code}] ${message}`
    super(message)
    this.name = 'TvmError'// this.constructor.name
    this.code = code
    this.status = status
  }
}

/**
 * @enum {string} TvmError codes
 */
TvmError.codes = {
  BadArgument: 'BadArgument',
  StatusError: 'StatusError'
}

module.exports = { TvmError }
