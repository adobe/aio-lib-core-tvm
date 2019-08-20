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

const wrapInFetchResponse = (body) => {
  return {
    ok: true,
    json: () => body
  }
}
const wrapInFetchError = (status) => {
  return {
    ok: false,
    json: () => 'error',
    status
  }
}

const genCacheKey = (input) => input.ow.namespace + '-' + (input.apiUrl || TvmClient.DefaultApiHost) + '/' + TvmClient.AzureBlobEndpoint

beforeEach(async () => {
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
  cacheContent = JSON.stringify({ [genCacheKey(fakeTVMInput)]: fakeAzureTVMResponse })
})

describe('init', () => {
  describe('with bad arguments', () => {
    test('no args', async () => {
      const instantiate = () => TvmClient.init()
      await expect(instantiate).toThrowBadArgWithMessageContaining(['config', 'required'])
    })
    test('missing ow object', async () => {
      const badInput = { ...fakeTVMInput }
      badInput.ow = undefined
      const instantiate = () => TvmClient.init(badInput)
      await expect(instantiate).toThrowBadArgWithMessageContaining(['ow', 'required'])
    })
  })
  describe('api url', () => {
    test('when not specified', async () => {
      const tvm = TvmClient.init(fakeTVMInput)
      expect(tvm.apiUrl).toEqual(TvmClient.DefaultApiHost)
    })
    test('when specified', async () => {
      const apiUrl = 'https://fake.com'
      const tvm = TvmClient.init({ ...fakeTVMInput, apiUrl })
      expect(tvm.apiUrl).toEqual(apiUrl)
    })
  })
})

describe('getAzureBlobCredentials', () => {
  describe('without caching', () => {
    test('when tvm response is valid', async () => {
      // fake the fetch to the TVM
      fetch.mockResolvedValue(wrapInFetchResponse(fakeAzureTVMResponse))
      fakeTVMInput.cacheFile = false
      const tvmClient = TvmClient.init(fakeTVMInput)
      const creds = await tvmClient.getAzureBlobCredentials()
      expect(creds).toEqual(fakeAzureTVMResponse)
      // calls with namespace as path arg
      expect(fetch.mock.calls[0][0]).toEqual(TvmClient.DefaultApiHost + '/' + TvmClient.AzureBlobEndpoint + '/' + fakeTVMInput.ow.namespace)
      // adds Authorization header
      expect(fetch.mock.calls[0][1].headers).toEqual(expect.objectContaining({ 'Authorization': fakeTVMInput.ow.auth }))
    })
    test('when tvm response has a server error', async () => {
      // fake the fetch to the TVM
      fetch.mockResolvedValue(wrapInFetchError(500))
      fakeTVMInput.cacheFile = false
      const tvmClient = TvmClient.init(fakeTVMInput)
      await expect(tvmClient.getAzureBlobCredentials.bind(tvmClient)).toThrowStatusError(500)
    })
    test('when tvm fetch is unauthorized', async () => {
      // fake the fetch to the TVM
      fetch.mockResolvedValue(wrapInFetchError(401))
      fakeTVMInput.cacheFile = false
      const tvmClient = TvmClient.init(fakeTVMInput)
      await expect(tvmClient.getAzureBlobCredentials.bind(tvmClient)).toThrowStatusError(401)
    })
  })
  describe('with caching to file', () => {
    test('when cache exists', async () => {
      fetch.mockResolvedValue(wrapInFetchResponse({ 'bad': 'response' }))
      fs.readFile.mockResolvedValue(Buffer.from(cacheContent))
      fakeTVMInput.cacheFile = '/cache'
      const tvmClient = TvmClient.init(fakeTVMInput)
      const creds = await tvmClient.getAzureBlobCredentials()

      expect(creds).toEqual(fakeAzureTVMResponse)
      expect(fs.readFile).toHaveBeenCalledWith(fakeTVMInput.cacheFile)
    })

    test('when cache is empty', async () => {
      fetch.mockResolvedValue(wrapInFetchResponse(fakeAzureTVMResponse))
      fs.readFile.mockRejectedValue(new Error('should be catched'))

      fakeTVMInput.cacheFile = '/cache'
      const tvmClient = TvmClient.init(fakeTVMInput)
      const creds = await tvmClient.getAzureBlobCredentials()

      expect(creds).toEqual(fakeAzureTVMResponse)
      expect(fs.writeFile).toHaveBeenCalledWith(fakeTVMInput.cacheFile, cacheContent)
    })

    test('when cache for other key exists', async () => {
      const prevObject = { prevKey: { fake: 'creds' } }
      fetch.mockResolvedValue(wrapInFetchResponse(fakeAzureTVMResponse))
      fs.readFile.mockResolvedValue(Buffer.from(JSON.stringify(prevObject)))

      const tvmClient = TvmClient.init(fakeTVMInput)
      const creds = await tvmClient.getAzureBlobCredentials()

      expect(creds).toEqual(fakeAzureTVMResponse)
      expect(fs.writeFile).toHaveBeenCalledWith(TvmClient.DefaultTVMCacheFile, JSON.stringify({ ...prevObject, [genCacheKey(fakeTVMInput)]: fakeAzureTVMResponse }))
    })

    test('when cache for same key exists but is expired', async () => {
      const prevObject = { [genCacheKey(fakeTVMInput)]: { fake: 'creds', expiration: minDate } }
      fetch.mockResolvedValue(wrapInFetchResponse(fakeAzureTVMResponse))
      fs.readFile.mockResolvedValue(Buffer.from(JSON.stringify(prevObject)))

      const tvmClient = TvmClient.init(fakeTVMInput)
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
    const tvmClient = TvmClient.init(fakeTVMInput)
    const creds = await tvmClient.getAwsS3Credentials()
    expect(creds).toEqual(fakeAwsS3Response)
    expect(fetch.mock.calls[0][0]).toEqual(TvmClient.DefaultApiHost + '/' + TvmClient.AwsS3Endpoint + '/' + fakeTVMInput.ow.namespace)
    expect(fetch.mock.calls[0][1].headers).toEqual(expect.objectContaining({ 'Authorization': fakeTVMInput.ow.auth }))
  })
})
