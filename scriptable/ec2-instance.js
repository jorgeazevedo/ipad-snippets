// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: magic;

/*
 * Requires the following keys in the Keychain:
 *  - aws_access_key
 *  - aws_secret_key
 *  - aws_instace_id
 *
 * Here's the code to add them
 *
 *  Keychain.set("aws_access_key","XXXXXXXX")
 *  Keychain.set("aws_secret_key","XXXXXXXX")
 *  Keychain.set("aws_instace_id","XXXXXXXX")
 *
 */

CryptoJS = importModule('lib/crypto-js')
importModule('lib/filter')

function sign(key, msg) {
    return CryptoJS.HmacSHA256(msg, key);
}


function getSignatureKey(key, dateStamp, regionName, serviceName) {
    kDate = sign('AWS4' + key, dateStamp)
    kRegion = sign(kDate, regionName)
    kService = sign(kRegion, serviceName)
    kSigning = sign(kService, 'aws4_request')
    return kSigning
}

function awsApiGet(request_parameters) {
	access_key = Keychain.get("aws_access_key")
	secret_key = Keychain.get("aws_secret_key")

	method = 'GET'
	service = 'ec2'
	host = 'ec2.eu-west-1.amazonaws.com'
	endpoint = 'https://ec2.eu-west-1.amazonaws.com'
	region = 'eu-west-1'
	now = new Date();
	let amzdate = now.toISOString().replace(/[-:]/g,'').replace(/\.\d\d\d/g,'');
	let datestamp =  amzdate.slice(0,8);

	canonical_uri = '/' 
	canonical_querystring = request_parameters

	canonical_headers = `host:${host}
x-amz-date:${amzdate}
`
	signed_headers = 'host;x-amz-date'
	payload_hash = CryptoJS.SHA256("").toString();
	canonical_request = `${method}
${canonical_uri}
${canonical_querystring}
${canonical_headers}
${signed_headers}
${payload_hash}`

	algorithm = 'AWS4-HMAC-SHA256'
	credential_scope = `${datestamp}/${region}/${service}/aws4_request`
	string_to_sign = 
`${algorithm}
${amzdate}
${credential_scope}
${CryptoJS.SHA256(canonical_request).toString()}`

	signing_key = getSignatureKey(secret_key, datestamp, region, service)
	signature = CryptoJS.HmacSHA256(string_to_sign, signing_key);
	authorization_header = `${algorithm} ` +
			       `Credential=${access_key}/${credential_scope}, ` +
			       `SignedHeaders=${signed_headers}, ` +
			       `Signature=${signature}`
	let request = new Request(`${endpoint}?${canonical_querystring}`);
	request.headers = {
		"x-amz-date": amzdate,
		"Authorization": authorization_header
	}

	return request
}

// request = awsApiGet(`Action=StartInstances&InstanceId.1=${Keychain.get("aws_instace_id")}&Version=2016-11-15`);
//request = awsApiGet(`Action=StopInstances&InstanceId.1=${Keychain.get("aws_instace_id")}&Version=2016-11-15`);
request = awsApiGet(`Action=DescribeInstances&InstanceId.1=${Keychain.get("aws_instace_id")}&Version=2016-11-15`);
let content = await request.loadString()


console.log(content)
var statusLine = content.split('\n').filter(function(a){ return a.indexOf("name") > 0})[0]
body = statusLine.slice(22, -7);
//body = statusLine.slice(30, -7);
not = new Notification();
not.title = `Got it!`
not.body = `Status: ${body}`;
not.schedule();

