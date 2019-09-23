describe('e2e tests: Aws S3', () => {
  global.testAllGeneric('getAwsS3Credentials', {
    params: { Bucket: expect.any(String) },
    accessKeyId: expect.any(String),
    secretAccessKey: expect.any(String),
    sessionToken: expect.any(String),
    expiration: expect.any(String)
  })
})
