## Classes

<dl>
<dt><a href="#TvmClient">TvmClient</a></dt>
<dd><p>Client SDK for Token Vending Machine (TVM)</p>
</dd>
<dt><a href="#TvmError">TvmError</a> ⇐ <code>Error</code></dt>
<dd><p>Token Vending Machine Client Errors</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#OpenWhiskCredentials">OpenWhiskCredentials</a> : <code>object</code></dt>
<dd><p>An object holding the OpenWhisk credentials</p>
</dd>
<dt><a href="#TvmResponseAzureBlob">TvmResponseAzureBlob</a> : <code>object</code></dt>
<dd><p>Tvm response with SAS Azure Blob credentials. Contains SAS credentials for a private and a publicly accessible (with access=<code>blob</code>) azure
blob container. These two signed URLs can then be passed to the azure blob storage sdk.</p>
</dd>
<dt><a href="#TvmResponseAzureCosmos">TvmResponseAzureCosmos</a> : <code>object</code></dt>
<dd><p>Tvm response with Azure Cosmos resource credentials. Gives access to an isolated partition within a CosmosDB container.</p>
</dd>
<dt><a href="#TvmResponseAwsS3">TvmResponseAwsS3</a> : <code>object</code></dt>
<dd><p>Tvm response with Aws S3 temporary credentials. These credentials give access to files in a restricted prefix:
<code>&lt;your-namespace&gt;/</code>. Other locations in the bucket cannot be accessed. The response can be passed directly to the aws sdk
to instantiate the s3 object.</p>
</dd>
</dl>

<a name="TvmClient"></a>

## TvmClient
Client SDK for Token Vending Machine (TVM)

**Kind**: global class  

* [TvmClient](#TvmClient)
    * _instance_
        * [.getAzureBlobCredentials()](#TvmClient+getAzureBlobCredentials) ⇒ [<code>Promise.&lt;TvmResponseAzureBlob&gt;</code>](#TvmResponseAzureBlob)
        * [.getAwsS3Credentials()](#TvmClient+getAwsS3Credentials) ⇒ [<code>Promise.&lt;TvmResponseAwsS3&gt;</code>](#TvmResponseAwsS3)
        * [.getAzureCosmosCredentials()](#TvmClient+getAzureCosmosCredentials) ⇒ [<code>Promise.&lt;TvmResponseAzureCosmos&gt;</code>](#TvmResponseAzureCosmos)
    * _static_
        * [.init(config)](#TvmClient.init) ⇒ [<code>Promise.&lt;TvmClient&gt;</code>](#TvmClient)

<a name="TvmClient+getAzureBlobCredentials"></a>

### tvmClient.getAzureBlobCredentials() ⇒ [<code>Promise.&lt;TvmResponseAzureBlob&gt;</code>](#TvmResponseAzureBlob)
Request temporary credentials for Azure blob storage.

 ```javascript
const tvmResponse = await tvm.getAzureBlobCredentials()

const azure = require('@azure/storage-blob')
const azureCreds = new azure.AnonymousCredential()
const pipeline = azure.StorageURL.newPipeline(azureCreds)
const containerURLPrivate = new azure.ContainerURL(tvmResponse.sasURLPrivate, pipeline)
const containerURLPublic = new azure.ContainerURL(tvmResponse.sasURLPublic, pipeline)
```

**Kind**: instance method of [<code>TvmClient</code>](#TvmClient)  
**Returns**: [<code>Promise.&lt;TvmResponseAzureBlob&gt;</code>](#TvmResponseAzureBlob) - SAS credentials for Azure  
**Throws**:

- [<code>TvmError</code>](#TvmError) 

<a name="TvmClient+getAwsS3Credentials"></a>

### tvmClient.getAwsS3Credentials() ⇒ [<code>Promise.&lt;TvmResponseAwsS3&gt;</code>](#TvmResponseAwsS3)
Request temporary credentials for AWS S3.

```javascript
const tvmResponse = await tvm.getAwsS3Credentials()

const aws = require('aws-sdk')
const s3 = new aws.S3(tvmResponse)
```

**Kind**: instance method of [<code>TvmClient</code>](#TvmClient)  
**Returns**: [<code>Promise.&lt;TvmResponseAwsS3&gt;</code>](#TvmResponseAwsS3) - Temporary credentials for AWS S3  
**Throws**:

- [<code>TvmError</code>](#TvmError) 

<a name="TvmClient+getAzureCosmosCredentials"></a>

### tvmClient.getAzureCosmosCredentials() ⇒ [<code>Promise.&lt;TvmResponseAzureCosmos&gt;</code>](#TvmResponseAzureCosmos)
Request temporary credentials for Azure CosmosDB.

```javascript
const azureCosmosCredentials = await tvm.getAzureCosmosCredentials()
const cosmos = require('@azure/cosmos')
const container = new cosmos.CosmosClient({ endpoint: azureCosmosCredentials.endpoint, tokenProvider: async () => azureCosmosCredentials.resourceToken })
                            .database(azureCosmosCredentials.databaseId)
                            .container(azureCosmosCredentials.containerId)
const data = await container.item('<itemKey>', azureCosmosCredentials.partitionKey).read()
```

**Kind**: instance method of [<code>TvmClient</code>](#TvmClient)  
**Returns**: [<code>Promise.&lt;TvmResponseAzureCosmos&gt;</code>](#TvmResponseAzureCosmos) - Temporary credentials for Azure Cosmos  
**Throws**:

- [<code>TvmError</code>](#TvmError) 

<a name="TvmClient.init"></a>

### TvmClient.init(config) ⇒ [<code>Promise.&lt;TvmClient&gt;</code>](#TvmClient)
Creates a TvmClient instance

```javascript
const TvmClient = require('@adobe/adobeio-cna-tvm-client')
const tvm = await TvmClient.init({ ow: { namespace, auth } })
```

**Kind**: static method of [<code>TvmClient</code>](#TvmClient)  
**Returns**: [<code>Promise.&lt;TvmClient&gt;</code>](#TvmClient) - new instance  
**Throws**:

- [<code>TvmError</code>](#TvmError) 


| Param | Type | Description |
| --- | --- | --- |
| config | <code>object</code> | TvmClientParams |
| config.apiUrl | <code>string</code> | url to tvm api |
| [config.ow] | [<code>OpenWhiskCredentials</code>](#OpenWhiskCredentials) | Openwhisk credentials. As an alternative you can pass those through environment variables: `__OW_NAMESPACE` and `__OW_AUTH` |
| [config.cacheFile] | <code>string</code> | if omitted defaults to tmpdir/.tvmCache, use false or null to not cache |

<a name="TvmError"></a>

## TvmError ⇐ <code>Error</code>
Token Vending Machine Client Errors

**Kind**: global class  
**Extends**: <code>Error</code>  

* [TvmError](#TvmError) ⇐ <code>Error</code>
    * [.TvmError](#TvmError.TvmError)
        * [new TvmError(message, code, [status])](#new_TvmError.TvmError_new)
    * [.codes](#TvmError.codes) : <code>enum</code>

<a name="TvmError.TvmError"></a>

### TvmError.TvmError
**Kind**: static class of [<code>TvmError</code>](#TvmError)  
<a name="new_TvmError.TvmError_new"></a>

#### new TvmError(message, code, [status])
Creates an instance of TvmError.


| Param | Type | Description |
| --- | --- | --- |
| message | <code>string</code> | error message |
| code | [<code>codes</code>](#TvmError.codes) | Storage Error code |
| [status] | <code>number</code> | status code in case of request error |

<a name="TvmError.codes"></a>

### TvmError.codes : <code>enum</code>
TvmError codes

**Kind**: static enum of [<code>TvmError</code>](#TvmError)  
**Properties**

| Name | Type | Default |
| --- | --- | --- |
| BadArgument | <code>string</code> | <code>&quot;BadArgument&quot;</code> | 
| StatusError | <code>string</code> | <code>&quot;StatusError&quot;</code> | 

<a name="OpenWhiskCredentials"></a>

## OpenWhiskCredentials : <code>object</code>
An object holding the OpenWhisk credentials

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| namespace | <code>string</code> | user namespace |
| auth | <code>string</code> | auth key |

<a name="TvmResponseAzureBlob"></a>

## TvmResponseAzureBlob : <code>object</code>
Tvm response with SAS Azure Blob credentials. Contains SAS credentials for a private and a publicly accessible (with access=`blob`) azure
blob container. These two signed URLs can then be passed to the azure blob storage sdk.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| sasURLPrivate | <code>string</code> | sas url to existing private azure blob container |
| sasURLPublic | <code>string</code> | sas url to existing public (with access=`blob`) azure blob container |
| expiration | <code>string</code> | expiration date ISO/UTC |

<a name="TvmResponseAzureCosmos"></a>

## TvmResponseAzureCosmos : <code>object</code>
Tvm response with Azure Cosmos resource credentials. Gives access to an isolated partition within a CosmosDB container.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| endpoint | <code>string</code> | cosmosdb resource endpoint |
| resourceToken | <code>string</code> | cosmosdb resource token restricted to access the items in the partitionKey |
| databaseId | <code>string</code> | id for cosmosdb database |
| containerId | <code>string</code> | id for cosmosdb container within database |
| partitionKey | <code>string</code> | key for cosmosdb partition within container authorized by resource token |
| expiration | <code>string</code> | expiration date ISO/UTC |

<a name="TvmResponseAwsS3"></a>

## TvmResponseAwsS3 : <code>object</code>
Tvm response with Aws S3 temporary credentials. These credentials give access to files in a restricted prefix:
`<your-namespace>/`. Other locations in the bucket cannot be accessed. The response can be passed directly to the aws sdk
to instantiate the s3 object.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| accessKeyId | <code>string</code> | key id |
| secretAccessKey | <code>string</code> | secret for key |
| sessionToken | <code>string</code> | token |
| expiration | <code>string</code> | date ISO/UTC |
| params | <code>object</code> |  |
| params.Bucket | <code>string</code> | bucket name |

