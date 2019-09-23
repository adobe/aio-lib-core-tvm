// test namespace is not = to deployment namespace
// module.exports = {
//   apiUrl: `https://${process.env['AIO_RUNTIME_NAMESPACE']}.${process.env['AIO_RUNTIME_APIHOST'].split('https://')[1]}/apis/tvm`,
//   testNamespace: process.env['TEST_NAMESPACE'],
//   testAuth: process.env['TEST_AUTH'],
//   testNamespaceNotWhitelisted: process.env['TEST_NAMESPACE_NOT_WHITELISTED'],
//   testAuthNotWhitelisted: process.env['TEST_AUTH_NOT_WHITELISTED'],
//   whitelist: process.env['WHITELIST']
// }

module.exports = {
  apiUrl: `https://adobeio.adobeioruntime.net/apis/tvm/`,
  testNamespace: process.env['TEST_NAMESPACE'],
  testAuth: process.env['TEST_AUTH']
}
