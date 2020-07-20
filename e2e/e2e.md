# Adobe I/O Lib Core TVM E2E Tests

## Requirements

The following environment variables must be set:

```bash
TEST_NAMESPACE_1, TEST_AUTH_1 (OpenWhisk namespace and auth)
TVM_API_URL
```

## Run

`npm run e2e`

## Test overview

Here is an overview of what is tested in [e2e.js](./e2e.js):

- aws s3 e2e test:
  - get aws tokens from tvm using valid OpenWhisk auth and namespace
  - initialize s3 sdk
  - list blobs in namespace bucket
  - `expect status=200`
  - list blobs in other namespace bucket
  - `expect errorCode = AccessDenied`
  - list buckets
  - `expect errorCode = AccessDenied`
- azure blob e2e test:
  - get azure SAS urls from tvm using valid OpenWhisk auth and namespace
  - initialize azure-blob sdk
  - list blobs in private container using sasURLPrivate
  - `expect status=200`
  - list blobs in public container using sasURLPublic
  - `expect status=200`
- azure cosmos e2e test:
  - get cosmos tokens from tvm using valid OpenWhisk auth and namespace
  - initialize azure-cosmos sdk
  - put a key using allowed partitionKey, containerId and databaseId
  - `expect 200<=status<300`
  - delete key
  - put key using other databaseId
  - `expect status=403`
  - put key using other containerId
  - `expect status=403`
  - put key using other partitionKey
  - `expect status=403`
- test missing OpenWhisk auth
  - init
  - `expect error.code=ERROR_BAD_ARGUMRNT`
- test bad auth good namespace
  - for each endpoint:
    - `expect status=403`
- test namespace, good auth
  - for each endpoint:
    - `expect status=403`
