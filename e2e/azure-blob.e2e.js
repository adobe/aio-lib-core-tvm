describe('e2e tests: Azure Blob', () => {
  global.testAllGeneric('getAzureBlobCredentials', {
    sasURLPrivate: expect.any(String),
    sasURLPublic: expect.any(String),
    expiration: expect.any(String)
  })
})
