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
beforeEach(() => {
  expect.hasAssertions()
})

const config = require('./config')
const TvmClient = require('../')

if (!config.apiUrl.endsWith('/')) config.apiUrl = config.apiUrl + '/'

const checkStatusError = async (func, status) => {
  try {
    const res = await func()
    throw res
  } catch (e) {
    if (e.name !== 'TvmLibError') throw e
    expect(e.sdkDetails.status).toEqual(status)
  }
}

global.testAllGeneric = (tvmFunc, expectedResponse) => {
  test(`get credentials using valid namespace and auth`, async () => {
    const tvm = await TvmClient.init({ ow: { namespace: config.testNamespace, auth: config.testAuth }, cacheFile: false, apiUrl: config.apiUrl })
    const creds = await tvm[tvmFunc]()
    expect(creds).toMatchObject(expectedResponse)
    const expirationDate = new Date(creds.expiration)
    const now = new Date()
    expect(expirationDate.getSeconds()).toBeLessThanOrEqual(now.getSeconds() + 3600)
  })

  test(`get credentials with missing auth`, async () => {
    try {
      await TvmClient.init({ ow: { namespace: 'another-ns', auth: undefined }, cacheFile: false, apiUrl: config.apiUrl })
    } catch (e) {
      if (e.name !== 'TvmLibError') throw e
      expect(e.code).toEqual('ERROR_BAD_ARGUMENT')
    }
    // should we test if to hits the tvm (should be 401)
  })

  test(`get credentials with bad auth`, async () => {
    const tvm = await TvmClient.init({ ow: { namespace: config.testNamespace, auth: 'bad:auth' }, cacheFile: false, apiUrl: config.apiUrl })
    await checkStatusError(tvm[tvmFunc].bind(tvm), 403)
  })

  test(`get credentials with bad namespace (but valid auth)`, async () => {
    const tvm = await TvmClient.init({ ow: { namespace: 'another-ns', auth: config.testAuth }, cacheFile: false, apiUrl: config.apiUrl })
    await checkStatusError(tvm[tvmFunc].bind(tvm), 403)
  })
  // TODO check whitelist (if deployed with a non star whitelist)

  // do some tests on the rest api directly? (common, should not be run for each endpoint)
  // e.g.: change auth header format, send request to bad endpoint, check other methods

  // test(`get credentials for a bad endpoint`, async () => {
  //   const tvm = await TvmClient.init({ ow: { namespace: 'another-ns', auth: config.testAuth }, cacheFile: false, apiUrl: config.apiUrl })
  //   checkStatusError(tvm._getCredentials('bad-enpoint/'), 404)
  // })
}
