describe('e2e tests: Azure Cosmos', () => {
  global.testAllGeneric('getAzureCosmosCredentials', {
    endpoint: expect.any(String),
    resourceToken: expect.any(String),
    databaseId: expect.any(String),
    containerId: expect.any(String),
    partitionKey: expect.any(String),
    expiration: expect.any(String)
  })
})
