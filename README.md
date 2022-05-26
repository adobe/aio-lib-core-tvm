[![Version](https://img.shields.io/npm/v/@adobe/aio-lib-core-tvm.svg)](https://npmjs.org/package/@adobe/aio-lib-core-tvm)
[![Downloads/week](https://img.shields.io/npm/dw/@adobe/aio-lib-core-tvm.svg)](https://npmjs.org/package/@adobe/aio-lib-core-tvm)
[![Node.js CI](https://github.com/adobe/aio-lib-core-tvm/actions/workflows/node.js.yml/badge.svg)](https://github.com/adobe/aio-lib-core-tvm/actions/workflows/node.js.yml)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0) 
[![Codecov
Coverage](https://img.shields.io/codecov/c/github/adobe/aio-lib-core-tvm/master.svg?style=flat-square)](https://codecov.io/gh/adobe/aio-lib-core-tvm/)

# Adobe I/O Lib Core Token Vending Machine

A JS client to access the token vending machine.

For more details on the server side, `goto` [adobe/aio-tvm](https://github.com/adobe/aio-tvm)

## Install

`npm install @adobe/aio-lib-core-tvm`

## Use

```javascript
const TvmClient = require('@adobe/aio-lib-core-tvm')
// init
const tvm = await TvmClient.init({ ow: { auth: '<myauth>', namespace: '<mynamespace>' } })
// init with retryOptions
const tvm = await TvmClient.init({ ow: { auth: '<myauth>', namespace: '<mynamespace>' }, retryOptions: { maxRetries: 5, initialDelayInMillis: 100} })

// aws s3
const awsS3Credentials = await tvm.getAwsS3Credentials()
const aws = require('aws-sdk')
const s3 = new aws.S3(awsS3Credentials)
// ...operations on s3 object

// azure blob
const azureBlobCredentials = await tvm.getAzureBlobCredentials()
const azure = require('@azure/storage-blob')
const azureCreds = new azure.AnonymousCredential()
const pipeline = azure.newPipeline(azureCreds)
const containerClientPrivate = new azure.ContainerClient(azureBlobCredentials.sasURLPrivate, pipeline)
const containerClientPublic = new azure.ContainerClient(azureBlobCredentials.sasURLPublic, pipeline)
// ...operations on containerClientPrivate and containerClientPublic

// azure cosmos
const azureCosmosCredentials = await tvm.getAzureCosmosCredentials()
const cosmos = require('@azure/cosmos')
const container = new cosmos.CosmosClient({ endpoint: azureCosmosCredentials.endpoint, tokenProvider: async () => azureCosmosCredentials.resourceToken })
                            .database(azureCosmosCredentials.databaseId)
                            .container(azureCosmosCredentials.containerId)
const data = await container.item('<itemKey>', azureCosmosCredentials.partitionKey).read()
// ...operations on items within azureCosmosCredentials.partitionKey
```

## Explore

`goto` [API](doc/api.md)

## Debug

set `DEBUG=@adobe/aio-lib-core-tvm*` to see debug logs.

## Contributing

Contributions are welcomed! Read the [Contributing Guide](./.github/CONTRIBUTING.md) for more information.

## Licensing

This project is licensed under the Apache V2 License. See [LICENSE](LICENSE) for more information.
