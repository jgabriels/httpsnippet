/**
 * @description
 * HTTP code snippet generator for Objective-C using NSURLSession.
 *
 * @author
 * @thibaultCha
 *
 * for any questions or issues regarding the generated code snippet, please open an issue mentioning the author.
 */

'use strict'

var util = require('util')
var objcHelpers = require('./helpers')
var CodeBuilder = require('../../helpers/code-builder')

module.exports = function (source, options) {
  var opts = util._extend({
    timeout: '10',
    indent: '    ',
    pretty: true
  }, options)

  var indent = opts.indent
  var code = new CodeBuilder(opts.indent)
  // Markers for headers to be created as litteral objects and later be set on the NSURLRequest if exist
  var req = {
    hasHeaders: false,
    hasBody: false
  }

  // We just want to make sure people understand that is the only dependency
  code.push('#import <Foundation/Foundation.h>')

  if (Object.keys(source.allHeaders).length) {
    req.hasHeaders = true
    code.push(null)
    code.push(objcHelpers.nsDeclaration('NSDictionary', 'headers', source.allHeaders, opts.pretty))
  }

  if (source.postData.text || source.postData.jsonObj || source.postData.params) {
    req.hasBody = true

    switch (source.postData.mimeType) {
      case 'application/x-www-form-urlencoded':
        code.push(null)
        // By appending parameters one by one in the resulting snippet,
        // we make it easier for the user to edit it according to his or her needs after pasting.
        // The user can just add/remove lines adding/removing body parameters.
        code.push(util.format('NSMutableData *postData = [[NSMutableData alloc] initWithData:[@"%s=%s" dataUsingEncoding:NSUTF8StringEncoding]];',
          source.postData.params[0].name, source.postData.params[0].value))
        for (var i = 1, len = source.postData.params.length; i < len; i++) {
          code.push(util.format('[postData appendData:[@"&%s=%s" dataUsingEncoding:NSUTF8StringEncoding]];',
            source.postData.params[i].name, source.postData.params[i].value))
        }
        break

      case 'application/json':
        if (source.postData.jsonObj) {
          code.push(objcHelpers.nsDeclaration('NSDictionary', 'parameters', source.postData.jsonObj, opts.pretty))
          code.push(null)
          code.push('NSData *postData = [NSJSONSerialization dataWithJSONObject:parameters options:0 error:nil];')
        }
        break

      case 'multipart/form-data':
        code.push(objcHelpers.multipartBody(source, opts))
        break

      default:
        code.push(null)
        code.push('NSData *postData = [[NSData alloc] initWithData:[@"' + source.postData.text + '" dataUsingEncoding:NSUTF8StringEncoding]];')
    }
  }

  code.push(null)
  code.push('NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:[NSURL URLWithString:@"' + source.fullUrl + '"]')
  // NSURLRequestUseProtocolCachePolicy is the default policy, let's just always set it to avoid confusion.
  code.push('                                                       cachePolicy:NSURLRequestUseProtocolCachePolicy')
  code.push('                                                   timeoutInterval:' + parseInt(opts.timeout, 10).toFixed(1) + '];')
  code.push('[request setHTTPMethod:@"' + source.method + '"];')

  if (req.hasHeaders) {
    code.push('[request setAllHTTPHeaderFields:headers];')
  }

  if (req.hasBody) {
    code.push('[request setHTTPBody:postData];')
  }

  code.push(null)
  // Retrieving the shared session will be less verbose than creating a new one.
  code.push('NSURLSession *session = [NSURLSession sharedSession];')
  code.push('NSURLSessionDataTask *dataTask = [session dataTaskWithRequest:request')
  code.push('                                            completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {')
  code.push('                                            ' + indent + 'if (error) {')
  code.push('                                            ' + indent + indent + 'NSLog(@"%@", error);')
  code.push('                                            ' + indent + '} else {')
  // Casting the NSURLResponse to NSHTTPURLResponse so the user can see the status code.
  code.push('                                            ' + indent + indent + 'NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *) response;')
  code.push('                                            ' + indent + indent + 'NSLog(@"%@", httpResponse);')
  code.push('                                            ' + indent + '}')
  code.push('                                            }];')
  code.push('[dataTask resume];')

  return code.join()
}

module.exports.info = {
  key: 'nsurlsession',
  title: 'NSURLSession',
  link: 'https://developer.apple.com/library/mac/documentation/Foundation/Reference/NSURLSession_class/index.html',
  description: 'Foundation\'s NSURLSession request'
}
