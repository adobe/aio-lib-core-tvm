/*
Copyright 2021 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

global.AIO_ENV_IS_STAGE = true
const cloneDeep = require('lodash.clonedeep')
const TvmClient = require('../')

const fakeTVMInput = {
  ow: {
    namespace: 'fakens',
    auth: 'fakeauth'
  }
}
test('when apiURL not specified AIO_ENV_IS_STAGE set to true', async () => {
  const stageURL = 'https://firefly-tvm-stage.adobe.io'
  const tvm = await TvmClient.init(cloneDeep(fakeTVMInput))
  expect(tvm.apiUrl).toEqual(stageURL)
  expect(TvmClient.DefaultApiHost).toEqual(stageURL)
})
