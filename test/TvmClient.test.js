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

const TvmClient = require('../index')

const fs = require('fs-extra')
jest.mock('fs-extra')

const fetch = require('node-fetch')
jest.mock('node-fetch')

const maxDate = new Date(8640000000000000).toISOString()
const minDate = new Date(-8640000000000000).toISOString()

let fakeAzureTVMResponse
let fakeAwsS3Response
let fakeTVMInput
let cacheContent
let fakeAzureCosmosResponse

const wrapInFetchResponse = (body) => {
  return {
    ok: true,
    json: async () => body
  }
}
const wrapInFetchError = (status) => {
  return {
    ok: false,
    json: async () => 'error',
    text: async () => 'error',
    status
  }
}

const genCacheKey = (input) => input.ow.namespace + '-' + (input.apiUrl || TvmClient.DefaultApiHost) + '/' + TvmClient.AzureBlobEndpoint

beforeEach(async () => {
  expect.hasAssertions()
  await jest.restoreAllMocks()
  fs.readFile.mockReset()
  fs.writeFile.mockReset()
  fetch.mockReset()

  fakeTVMInput = {
    ow: {
      namespace: 'fakens',
      auth: 'fakeauth'
    }
  }
  fakeAzureTVMResponse = {
    expiration: maxDate,
    sasURLPrivate: 'https://fake.com',
    sasURLPublic: 'https://fake.com'
  }
  fakeAwsS3Response = {
    expiration: maxDate,
    accessKeyId: 'fake',
    secretAccessKey: 'fake',
    sessionToken: 'fake',
    params: { Bucket: 'fake' }
  }
  fakeAzureCosmosResponse = {
    expiration: maxDate,
    endpoint: 'https://fake.com',
    resourceTokens: 'fake',
    partitionKey: 'fake',
    databaseId: 'fakeDB',
    containerId: 'fakeContainer'
  }
  cacheContent = JSON.stringify({ [genCacheKey(fakeTVMInput)]: fakeAzureTVMResponse })
  delete process.env['__OW_AUTH']
  delete process.env['__OW_NAMESPACE']
})

describe('init', () => {
  describe('with bad arguments', () => {
    test('missing ow object', async () => {
      const badInput = { ...fakeTVMInput }
      badInput.ow = undefined
      const instantiate = async () => TvmClient.init(badInput)
      await expect(instantiate).toThrowBadArgWithMessageContaining(['ow', 'required'])
    })
    test('unknown config key', async () => {
      const badInput = { ...fakeTVMInput }
      badInput.badKey = 'smthg'
      const instantiate = async () => TvmClient.init(badInput)
      await expect(instantiate).toThrowBadArgWithMessageContaining(['badKey', 'not allowed'])
    })
  })
  describe('api url', () => {
    test('when not specified', async () => {
      const tvm = await TvmClient.init(fakeTVMInput)
      expect(tvm.apiUrl).toEqual(TvmClient.DefaultApiHost)
    })
    test('when specified', async () => {
      const apiUrl = 'https://fake.com'
      const tvm = await TvmClient.init({ ...fakeTVMInput, apiUrl })
      expect(tvm.apiUrl).toEqual(apiUrl)
    })
  })
  describe('pass ow through env', () => {
    test('when passing auth in __OW_AUTH', async () => {
      process.env['__OW_AUTH'] = fakeTVMInput.ow.auth
      delete fakeTVMInput.ow.auth
      const tvm = await TvmClient.init(fakeTVMInput)
      expect(tvm.apiUrl).toEqual(TvmClient.DefaultApiHost)
    })
    test('when passing namespace in __OW_NAMESPACE', async () => {
      process.env['__OW_NAMESPACE'] = fakeTVMInput.ow.namespace
      delete fakeTVMInput.ow.namespace
      const tvm = await TvmClient.init(fakeTVMInput)
      expect(tvm.apiUrl).toEqual(TvmClient.DefaultApiHost)
    })
    test('when passing both namespace and auth in __OW_NAMESPACE and __OW_AUTH', async () => {
      process.env['__OW_AUTH'] = fakeTVMInput.ow.auth
      process.env['__OW_NAMESPACE'] = fakeTVMInput.ow.namespace
      const tvm = await TvmClient.init()
      expect(tvm.apiUrl).toEqual(TvmClient.DefaultApiHost)
    })
  })
})

describe('getAzureBlobCredentials', () => {
  describe('without caching', () => {
    test('when tvm response is valid', async () => {
      // fake the fetch to the TVM
      fetch.mockResolvedValue(wrapInFetchResponse(fakeAzureTVMResponse))
      fakeTVMInput.cacheFile = false
      const tvmClient = await TvmClient.init(fakeTVMInput)
      const creds = await tvmClient.getAzureBlobCredentials()
      expect(creds).toEqual(fakeAzureTVMResponse)
      // calls with namespace as path arg
      expect(fetch.mock.calls[0][0]).toEqual(TvmClient.DefaultApiHost + '/' + TvmClient.AzureBlobEndpoint + '/' + fakeTVMInput.ow.namespace)
      // adds Authorization header
      expect(fetch.mock.calls[0][1].headers).toEqual(expect.objectContaining({ 'Authorization': fakeTVMInput.ow.auth }))
      expect(fs.readFile).toHaveBeenCalledTimes(0)
      expect(fs.writeFile).toHaveBeenCalledTimes(0)
    })
    test('when tvm response has a server error', async () => {
      // fake the fetch to the TVM
      fetch.mockResolvedValue(wrapInFetchError(500))
      fakeTVMInput.cacheFile = false
      const tvmClient = await TvmClient.init(fakeTVMInput)
      await expect(tvmClient.getAzureBlobCredentials.bind(tvmClient)).toThrowStatusError(500)
      expect(fs.readFile).toHaveBeenCalledTimes(0)
      expect(fs.writeFile).toHaveBeenCalledTimes(0)
    })
    test('when tvm fetch is unauthorized', async () => {
      // fake the fetch to the TVM
      fetch.mockResolvedValue(wrapInFetchError(401))
      fakeTVMInput.cacheFile = false
      const tvmClient = await TvmClient.init(fakeTVMInput)
      await expect(tvmClient.getAzureBlobCredentials.bind(tvmClient)).toThrowStatusError(401)
      expect(fs.readFile).toHaveBeenCalledTimes(0)
      expect(fs.writeFile).toHaveBeenCalledTimes(0)
    })
  })
  describe('with caching to file', () => {
    test('when default cache file exists (when cacheFile=undefined)', async () => {
      fetch.mockResolvedValue(wrapInFetchResponse({ 'bad': 'response' }))
      fs.readFile.mockResolvedValue(Buffer.from(cacheContent))

      const tvmClient = await TvmClient.init({ ...fakeTVMInput })
      const creds = await tvmClient.getAzureBlobCredentials()

      expect(creds).toEqual(fakeAzureTVMResponse)
      expect(fs.readFile).toHaveBeenCalledWith(TvmClient.DefaultTVMCacheFile)
    })
    test('when specified cache file exists', async () => {
      fetch.mockResolvedValue(wrapInFetchResponse({ 'bad': 'response' }))
      fs.readFile.mockResolvedValue(Buffer.from(cacheContent))
      fakeTVMInput.cacheFile = '/cache'
      const tvmClient = await TvmClient.init({ ...fakeTVMInput })
      const creds = await tvmClient.getAzureBlobCredentials()

      expect(creds).toEqual(fakeAzureTVMResponse)
      expect(fs.readFile).toHaveBeenCalledWith(fakeTVMInput.cacheFile)
    })

    test('when cache is empty', async () => {
      fetch.mockResolvedValue(wrapInFetchResponse(fakeAzureTVMResponse))
      fs.readFile.mockRejectedValue(new Error('should be catched'))

      fakeTVMInput.cacheFile = '/cache'
      const tvmClient = await TvmClient.init({ ...fakeTVMInput })
      const creds = await tvmClient.getAzureBlobCredentials()

      expect(creds).toEqual(fakeAzureTVMResponse)
      expect(fs.writeFile).toHaveBeenCalledWith(fakeTVMInput.cacheFile, cacheContent)
    })

    test('when cache for other key exists', async () => {
      const prevObject = { prevKey: { fake: 'creds' } }
      fetch.mockResolvedValue(wrapInFetchResponse(fakeAzureTVMResponse))
      fs.readFile.mockResolvedValue(Buffer.from(JSON.stringify(prevObject)))

      const tvmClient = await TvmClient.init({ ...fakeTVMInput })
      const creds = await tvmClient.getAzureBlobCredentials()

      expect(creds).toEqual(fakeAzureTVMResponse)
      expect(fs.writeFile).toHaveBeenCalledWith(TvmClient.DefaultTVMCacheFile, JSON.stringify({ ...prevObject, [genCacheKey(fakeTVMInput)]: fakeAzureTVMResponse }))
    })

    test('when cache for same key exists but is expired', async () => {
      const prevObject = { [genCacheKey(fakeTVMInput)]: { fake: 'creds', expiration: minDate } }
      fetch.mockResolvedValue(wrapInFetchResponse(fakeAzureTVMResponse))
      fs.readFile.mockResolvedValue(Buffer.from(JSON.stringify(prevObject)))

      const tvmClient = await TvmClient.init({ ...fakeTVMInput })
      const creds = await tvmClient.getAzureBlobCredentials()

      expect(creds).toEqual(fakeAzureTVMResponse)
      expect(fs.writeFile).toHaveBeenCalledWith(TvmClient.DefaultTVMCacheFile, JSON.stringify({ [genCacheKey(fakeTVMInput)]: fakeAzureTVMResponse }))
    })
  })
})

describe('getAwsS3Credentials', () => {
  // the general tests are same, we test just that the method is defined
  test('without caching when tvm response is valid', async () => {
    // fake the fetch to the TVM
    fetch.mockResolvedValue(wrapInFetchResponse(fakeAwsS3Response))
    fakeTVMInput.cacheFile = false
    const tvmClient = await TvmClient.init({ ...fakeTVMInput })
    const creds = await tvmClient.getAwsS3Credentials()
    expect(creds).toEqual(fakeAwsS3Response)
    expect(fetch.mock.calls[0][0]).toEqual(TvmClient.DefaultApiHost + '/' + TvmClient.AwsS3Endpoint + '/' + fakeTVMInput.ow.namespace)
    expect(fetch.mock.calls[0][1].headers).toEqual(expect.objectContaining({ 'Authorization': fakeTVMInput.ow.auth }))
  })
})

describe('getAzureCosmosCredentials', () => {
  // the general tests are same, we test just that the method is defined
  test('without caching when tvm response is valid', async () => {
    // fake the fetch to the TVM
    fetch.mockResolvedValue(wrapInFetchResponse(fakeAzureCosmosResponse))
    fakeTVMInput.cacheFile = false
    const tvmClient = await TvmClient.init({ ...fakeTVMInput })
    const creds = await tvmClient.getAzureCosmosCredentials()
    expect(creds).toEqual(fakeAzureCosmosResponse)
    expect(fetch.mock.calls[0][0]).toEqual(TvmClient.DefaultApiHost + '/' + TvmClient.AzureCosmosEndpoint + '/' + fakeTVMInput.ow.namespace)
    expect(fetch.mock.calls[0][1].headers).toEqual(expect.objectContaining({ 'Authorization': fakeTVMInput.ow.auth }))
  })
})
