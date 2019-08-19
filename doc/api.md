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
blob container. These two signed URLs can then be passed to the azure blob storage sdk, see the example below:</p>
<pre><code class="language-javascript">const azure = require(&#39;@azure/storage-blob&#39;)
const azureCreds = new azure.AnonymousCredential()
const pipeline = azure.StorageURL.newPipeline(azureCreds)
const containerURLPrivate = new azure.ContainerURL(tvmResponse.sasURLPrivate, pipeline)
const containerURLPublic = new azure.ContainerURL(tvmResponse.sasURLPublic, pipeline)</code></pre>
</dd>
<dt><a href="#TvmResponseAwsS3">TvmResponseAwsS3</a> : <code>object</code></dt>
<dd><p>Tvm response with Aws S3 temporary credentials. These credentials give access to files in a restricted prefix:
<code>&lt;your-namespace&gt;/</code>. Other locations in the bucket cannot be accessed. The response can be passed directly to the aws sdk
to instantiate the s3 object, see the example below:</p>
<pre><code class="language-javascript">const aws = require(&#39;aws-sdk&#39;)
const s3 = new aws.S3(tvmResponse)</code></pre>
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
    * _static_
        * [.init(config)](#TvmClient.init) ⇒ [<code>TvmClient</code>](#TvmClient)

<a name="TvmClient+getAzureBlobCredentials"></a>

### tvmClient.getAzureBlobCredentials() ⇒ [<code>Promise.&lt;TvmResponseAzureBlob&gt;</code>](#TvmResponseAzureBlob)
Request temporary credentials for Azure blob storage.

**Kind**: instance method of [<code>TvmClient</code>](#TvmClient)  
**Returns**: [<code>Promise.&lt;TvmResponseAzureBlob&gt;</code>](#TvmResponseAzureBlob) - SAS credentials for Azure  
**Throws**:

- [<code>TvmError</code>](#TvmError) 

<a name="TvmClient+getAwsS3Credentials"></a>

### tvmClient.getAwsS3Credentials() ⇒ [<code>Promise.&lt;TvmResponseAwsS3&gt;</code>](#TvmResponseAwsS3)
Request temporary credentials for AWS S3.

**Kind**: instance method of [<code>TvmClient</code>](#TvmClient)  
**Returns**: [<code>Promise.&lt;TvmResponseAwsS3&gt;</code>](#TvmResponseAwsS3) - Temporary credentials for AWS S3  
**Throws**:

- [<code>TvmError</code>](#TvmError) 

<a name="TvmClient.init"></a>

### TvmClient.init(config) ⇒ [<code>TvmClient</code>](#TvmClient)
Creates a TvmClient instance

**Kind**: static method of [<code>TvmClient</code>](#TvmClient)  
**Returns**: [<code>TvmClient</code>](#TvmClient) - new instance  
**Throws**:

- [<code>TvmError</code>](#TvmError) 


| Param | Type | Description |
| --- | --- | --- |
| config | <code>object</code> | TvmClientParams |
| config.apiUrl | <code>string</code> | url to tvm api |
| config.ow | [<code>OpenWhiskCredentials</code>](#OpenWhiskCredentials) | Openwhisk credentials |
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
blob container. These two signed URLs can then be passed to the azure blob storage sdk, see the example below:

```javascript
const azure = require('@azure/storage-blob')
const azureCreds = new azure.AnonymousCredential()
const pipeline = azure.StorageURL.newPipeline(azureCreds)
const containerURLPrivate = new azure.ContainerURL(tvmResponse.sasURLPrivate, pipeline)
const containerURLPublic = new azure.ContainerURL(tvmResponse.sasURLPublic, pipeline)
```

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| sasURLPrivate | <code>string</code> | sas url to existing private azure blob container |
| sasURLPublic | <code>string</code> | sas url to existing public (with access=`blob`) azure blob container |
| expiration | <code>string</code> | expiration date ISO/UTC |

<a name="TvmResponseAwsS3"></a>

## TvmResponseAwsS3 : <code>object</code>
Tvm response with Aws S3 temporary credentials. These credentials give access to files in a restricted prefix:
`<your-namespace>/`. Other locations in the bucket cannot be accessed. The response can be passed directly to the aws sdk
to instantiate the s3 object, see the example below:

```javascript
const aws = require('aws-sdk')
const s3 = new aws.S3(tvmResponse)
```

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

