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

const joi = require('@hapi/joi')
const fs = require('fs-extra')
const fetch = require('node-fetch').default
const upath = require('upath')
const tmp = require('os').tmpdir()

const { TvmError } = require('./TvmError')

/* istanbul ignore next */
/**
 * Joins url path parts
 *
 * @param {...string} args url parts
 * @returns {string} joined url
 * @private
 */
function urlJoin (...args) {
  let start = ''
  if (args[0] && args[0].startsWith('/')) start = '/'
  return start + args.map(a => a && a.replace(/(^\/|\/$)/g, '')).filter(a => a).join('/')
}

/**
 * An object holding the OpenWhisk credentials
 *
 * @typedef OpenWhiskCredentials
 * @type {object}
 * @property {string} namespace user namespace
 * @property {string} auth auth key
 */

/**
 * Tvm response with SAS Azure Blob credentials. Contains SAS credentials for a private and a publicly accessible (with access=`blob`) azure
 * blob container. These two signed URLs can then be passed to the azure blob storage sdk, see the example below:
 *
 * @typedef TvmResponseAzureBlob
 * @type {object}
 * @property {string} sasURLPrivate sas url to existing private azure blob
 * container
 * @property {string} sasURLPublic sas url to existing public (with
 * access=`blob`) azure blob container
 * @property {string} expiration expiration date ISO/UTC
 *
 */

/**
 * Tvm response with Azure Cosmos resource credentials. Gives access to an isolated partition within a CosmosDB container.
 *
 * @typedef TvmResponseAzureCosmos
 * @type {object}
 * @property {string} endpoint cosmosdb resource endpoint
 * @property {string} resourceToken cosmosdb resource token restricted to access the items in the partitionKey
 * @property {string} databaseId id for cosmosdb database
 * @property {string} containerId id for cosmosdb container within database
 * @property {string} partitionKey key for cosmosdb partition within container authorized by resource token
 * @property {string} expiration expiration date ISO/UTC
 *
 */

/**
 * Tvm response with Aws S3 temporary credentials. These credentials give access to files in a restricted prefix:
 * `<your-namespace>/`. Other locations in the bucket cannot be accessed. The response can be passed directly to the aws sdk
 * to instantiate the s3 object, see the example below:
 *
 * @typedef TvmResponseAwsS3
 * @type {object}
 * @property {string} accessKeyId key id
 * @property {string} secretAccessKey secret for key
 * @property {string} sessionToken token
 * @property {string} expiration date ISO/UTC
 * @property {object} params
 * @property {string} params.Bucket bucket name
 *
 */

/**
 * @class TvmClient
 * @classdesc Client SDK for Token Vending Machine (TVM)
 * @hideconstructor
 */
class TvmClient {
  // eslint-disable-next-line jsdoc/require-param
  constructor (config) {
    const res = joi.validate(config, joi.object().label('config').keys({
      ow: joi.object().keys({
        namespace: joi.string().required(),
        auth: joi.string().required()
      }).required(),
      apiUrl: joi.string().uri(),
      cacheFile: joi.any()
    }).required())
    if (res.error) throw new TvmError(res.error.message, TvmError.codes.BadArgument)

    this.ow = config.ow
    this.apiUrl = config.apiUrl || TvmClient.DefaultApiHost

    if (config.cacheFile === undefined) config.cacheFile = TvmClient.DefaultTVMCacheFile
    if (config.cacheFile) {
      this.cacheFile = config.cacheFile
    }
  }

  /**
   * Creates a TvmClient instance
   *
   * ```javascript
   * const TvmClient = require('@adobe/adobeio-cna-tvm-client')
   * const tvm = await TvmClient.init({ ow: { namespace, auth } })
   * ```
   *
   * @param  {object} config TvmClientParams
   * @param  {string} config.apiUrl url to tvm api
   * @param  {OpenWhiskCredentials} [config.ow] Openwhisk credentials. As an alternative you can pass those through environment
   * variables: `__OW_NAMESPACE` and `__OW_AUTH`
   * @param  {string} [config.cacheFile] if omitted defaults to
   * tmpdir/.tvmCache, use false or null to not cache
   * @returns {Promise<TvmClient>} new instance
   * @memberof TvmClient
   * @throws {TvmError}
   */
  static async init (config = {}) { // no need for async now, but let's keep it consistent with rest of sdk
    // include ow environment vars to credentials
    const namespace = process.env['__OW_NAMESPACE']
    const auth = process.env['__OW_AUTH']
    if (namespace || auth) {
      if (typeof config.ow !== 'object') {
        config.ow = {}
      }
      config.ow.namespace = config.ow.namespace || namespace
      config.ow.auth = config.ow.auth || auth
    }
    return new TvmClient(config)
  }

  async _getCredentialsFromTVM (url) {
    const urlWithNamespace = urlJoin(url, this.ow.namespace)
    const response = await fetch(urlWithNamespace, { headers: { 'Authorization': this.ow.auth } })
    if (response.ok) return response.json()
    throw new TvmError(`Error response from TVM with status ${response.status}`, TvmError.codes.StatusError, response.status)
  }

  async _cacheCredentialsToFile (cacheKey, creds) {
    if (!this.cacheFile) return null

    let allCreds
    try {
      const content = (await fs.readFile(this.cacheFile)).toString()
      allCreds = JSON.parse(content)
    } catch (e) {
      allCreds = {} // cache file does not exist or is invalid
    }

    // need to store by ow.namespace in case user changes ow.namespace in config
    allCreds[cacheKey] = creds
    await fs.writeFile(this.cacheFile, JSON.stringify(allCreds))

    return true
  }

  async _getCredentialsFromCacheFile (cacheKey) {
    if (!this.cacheFile) return null

    let creds
    try {
      const content = (await fs.readFile(this.cacheFile)).toString()
      creds = JSON.parse(content)[cacheKey]
    } catch (e) {
      return null // cache file does not exist or is invalid
    }
    if (!creds) return null // credentials for ow.namespace do not exist
    // give a minute less to account for the usage time
    if (Date.now() > (Date.parse(creds.expiration) - 60000)) return null
    return creds
  }

  /**
   * Reads the credentials from the TVM or cache
   *
   * @param {string} endpoint - TVM API endpoint
   * @private
   * @returns {Promise<object>} credentials for service
   */
  async _getCredentials (endpoint) {
    const fullUrl = urlJoin(this.apiUrl, endpoint)
    const cacheKey = `${this.ow.namespace}-${fullUrl}`

    let creds = await this._getCredentialsFromCacheFile(cacheKey)
    if (!creds) {
      creds = await this._getCredentialsFromTVM(fullUrl)
      await this._cacheCredentialsToFile(cacheKey, creds)
    }
    return creds
  }

  /**
   * Request temporary credentials for Azure blob storage.
   *
   *  ```javascript
   * const tvmResponse = await tvm.getAzureBlobCredentials()
   *
   * const azure = require('@azure/storage-blob')
   * const azureCreds = new azure.AnonymousCredential()
   * const pipeline = azure.StorageURL.newPipeline(azureCreds)
   * const containerURLPrivate = new azure.ContainerURL(tvmResponse.sasURLPrivate, pipeline)
   * const containerURLPublic = new azure.ContainerURL(tvmResponse.sasURLPublic, pipeline)
   * ```
   *
   * @returns {Promise<TvmResponseAzureBlob>} SAS credentials for Azure
   * @throws {TvmError}
   */
  async getAzureBlobCredentials () { return this._getCredentials(TvmClient.AzureBlobEndpoint) }

  /**
   * Request temporary credentials for AWS S3.
   *
   * ```javascript
   * const tvmResponse = await tvm.getAwsS3Credentials()
   *
   * const aws = require('aws-sdk')
   * const s3 = new aws.S3(tvmResponse)
   * ```
   *
   * @returns {Promise<TvmResponseAwsS3>} Temporary credentials for AWS S3
   * @throws {TvmError}
   */
  async getAwsS3Credentials () { return this._getCredentials(TvmClient.AwsS3Endpoint) }

  /**
   * Request temporary credentials for Azure CosmosDB.
   *
   * ```javascript
   * const azureCosmosCredentials = await tvm.getAzureCosmosCredentials()
   * const cosmos = require('@azure/cosmos')
   * const container = new cosmos.CosmosClient({ endpoint: azureCosmosCredentials.endpoint, tokenProvider: async () => azureCosmosCredentials.resourceToken })
   *                             .database(azureCosmosCredentials.databaseId)
   *                             .container(azureCosmosCredentials.containerId)
   * const data = await container.item('<itemKey>', azureCosmosCredentials.partitionKey).read()
   * ```
   *
   * @returns {Promise<TvmResponseAzureCosmos>} Temporary credentials for Azure Cosmos
   * @throws {TvmError}
   */
  async getAzureCosmosCredentials () { return this._getCredentials(TvmClient.AzureCosmosEndpoint) }
}

TvmClient.AzureBlobEndpoint = 'azure/blob'
TvmClient.AwsS3Endpoint = 'aws/s3'
TvmClient.AzureCosmosEndpoint = 'azure/cosmos'

// Adobe I/O default token-vending-machine api host
TvmClient.DefaultApiHost = 'https://adobeio.adobeioruntime.net/apis/tvm'
TvmClient.DefaultTVMCacheFile = upath.join(upath.join(tmp, '.tvmCache'))

module.exports = { TvmClient }
