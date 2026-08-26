___TERMS_OF_SERVICE___

By creating or modifying this file you agree to Google Tag Manager's Community
Template Gallery Developer Terms of Service available at
https://developers.google.com/tag-manager/gallery-tos (or such other URL as
Google may provide), as modified from time to time.


___INFO___

{
  "type": "TAG",
  "id": "cvt_temp_public_id",
  "version": 1,
  "securityGroups": [],
  "displayName": "VisitorAPI Personalize - Replace Text",
  "categories": [
    "UTILITY"
  ],
  "brand": {
    "id": "brand_dummy",
    "displayName": ""
  },
  "description": "Swap an element's text based on visitor country, language, currency, etc.",
  "containerContexts": [
    "WEB"
  ]
}


___TEMPLATE_PARAMETERS___

[
  {
    "type": "TEXT",
    "name": "projectId",
    "displayName": "Project ID",
    "simpleValueType": true,
    "help": "Your VisitorAPI project ID, from https://app.visitorapi.com."
  },
  {
    "type": "SIMPLE_TABLE",
    "name": "rules",
    "displayName": "Rules",
    "simpleTableColumns": [
      {
        "defaultValue": "country",
        "displayName": "Field",
        "name": "field",
        "type": "SELECT",
        "selectItems": [
          {
            "value": "country",
            "displayValue": "Country"
          },
          {
            "value": "region",
            "displayValue": "Region"
          },
          {
            "value": "city",
            "displayValue": "City"
          },
          {
            "value": "continent",
            "displayValue": "Continent"
          },
          {
            "value": "currency",
            "displayValue": "Currency"
          },
          {
            "value": "language",
            "displayValue": "Language"
          },
          {
            "value": "browser",
            "displayValue": "Browser"
          },
          {
            "value": "os",
            "displayValue": "OS"
          },
          {
            "value": "deviceType",
            "displayValue": "Device type"
          }
        ]
      },
      {
        "defaultValue": "",
        "displayName": "Value (comma-separated for multiple)",
        "name": "value",
        "type": "TEXT"
      },
      {
        "defaultValue": "",
        "displayName": "CSS selector",
        "name": "selector",
        "type": "TEXT"
      },
      {
        "defaultValue": "",
        "displayName": "New text",
        "name": "text",
        "type": "TEXT"
      }
    ],
    "help": "Every matching rule runs -- there's no first-match-wins."
  }
]


___SANDBOXED_JS_FOR_WEB_TEMPLATE___

const queryPermission = require('queryPermission');
const injectScript = require('injectScript');
const copyFromWindow = require('copyFromWindow');
const createQueue = require('createQueue');

const visitorApiUrl = 'https://cdn.visitorapi.com/visitor-api.js';
const personalizeUrl = 'https://cdn.visitorapi.com/personalize.js';

function splitValues(raw) {
  if (!raw) {
    return [];
  }
  var parts = raw.split(',');
  var out = [];
  for (var i = 0; i < parts.length; i++) {
    var trimmed = parts[i].trim();
    if (trimmed) {
      out.push(trimmed);
    }
  }
  return out;
}

function buildRules(rawRules) {
  var rules = [];
  for (var i = 0; i < rawRules.length; i++) {
    var row = rawRules[i];
    rules.push({
      field: row.field,
      value: splitValues(row.value),
      action: 'replaceText',
      selector: row.selector,
      content: row.text
    });
  }
  return rules;
}

var rules = buildRules(data.rules || []);

function pushDebugEvent(eventName, extra) {
  var dataLayerPush = createQueue('dataLayer');
  var payload = { event: eventName };
  if (extra) {
    for (var key in extra) {
      payload[key] = extra[key];
    }
  }
  dataLayerPush(payload);
}

function onPersonalizeLoaded(visitorData) {
  return function () {
    var personalize = copyFromWindow('VisitorAPIPersonalize');
    if (typeof personalize === 'undefined') {
      pushDebugEvent('visitor-api-personalize-error', {
        visitorApiPersonalizeErrorMessage: 'personalize.js did not load'
      });
      return;
    }
    var applied = personalize(rules, visitorData);
    pushDebugEvent('visitor-api-personalize-applied', {
      visitorApiPersonalizeRulesApplied: applied.length
    });
  };
}

function onVisitorData(visitorData) {
  if (queryPermission('inject_script', personalizeUrl)) {
    injectScript(personalizeUrl, onPersonalizeLoaded(visitorData));
  }
}

function onVisitorError(errorCode, errorMessage) {
  pushDebugEvent('visitor-api-personalize-error', {
    visitorApiPersonalizeErrorCode: errorCode,
    visitorApiPersonalizeErrorMessage: errorMessage
  });
}

if (queryPermission('inject_script', visitorApiUrl)) {
  injectScript(visitorApiUrl, function () {
    var api = copyFromWindow('VisitorAPI');
    if (typeof api !== 'undefined') {
      api(data.projectId, onVisitorData, onVisitorError);
    }
  });
}

// Call data.gtmOnSuccess when the tag is finished.
data.gtmOnSuccess();


___WEB_PERMISSIONS___

[
  {
    "instance": {
      "key": {
        "publicId": "access_globals",
        "versionId": "1"
      },
      "param": [
        {
          "key": "keys",
          "value": {
            "type": 2,
            "listItem": [
              {
                "type": 3,
                "mapKey": [
                  {
                    "type": 1,
                    "string": "key"
                  },
                  {
                    "type": 1,
                    "string": "read"
                  },
                  {
                    "type": 1,
                    "string": "write"
                  },
                  {
                    "type": 1,
                    "string": "execute"
                  }
                ],
                "mapValue": [
                  {
                    "type": 1,
                    "string": "VisitorAPI"
                  },
                  {
                    "type": 8,
                    "boolean": true
                  },
                  {
                    "type": 8,
                    "boolean": false
                  },
                  {
                    "type": 8,
                    "boolean": true
                  }
                ]
              },
              {
                "type": 3,
                "mapKey": [
                  {
                    "type": 1,
                    "string": "key"
                  },
                  {
                    "type": 1,
                    "string": "read"
                  },
                  {
                    "type": 1,
                    "string": "write"
                  },
                  {
                    "type": 1,
                    "string": "execute"
                  }
                ],
                "mapValue": [
                  {
                    "type": 1,
                    "string": "VisitorAPIPersonalize"
                  },
                  {
                    "type": 8,
                    "boolean": true
                  },
                  {
                    "type": 8,
                    "boolean": false
                  },
                  {
                    "type": 8,
                    "boolean": true
                  }
                ]
              },
              {
                "type": 3,
                "mapKey": [
                  {
                    "type": 1,
                    "string": "key"
                  },
                  {
                    "type": 1,
                    "string": "read"
                  },
                  {
                    "type": 1,
                    "string": "write"
                  },
                  {
                    "type": 1,
                    "string": "execute"
                  }
                ],
                "mapValue": [
                  {
                    "type": 1,
                    "string": "dataLayer"
                  },
                  {
                    "type": 8,
                    "boolean": true
                  },
                  {
                    "type": 8,
                    "boolean": true
                  },
                  {
                    "type": 8,
                    "boolean": false
                  }
                ]
              }
            ]
          }
        }
      ]
    },
    "clientAnnotations": {
      "isEditedByUser": true
    },
    "isRequired": true
  },
  {
    "instance": {
      "key": {
        "publicId": "inject_script",
        "versionId": "1"
      },
      "param": [
        {
          "key": "urls",
          "value": {
            "type": 2,
            "listItem": [
              {
                "type": 1,
                "string": "https://cdn.visitorapi.com/visitor-api.js"
              },
              {
                "type": 1,
                "string": "https://cdn.visitorapi.com/personalize.js"
              }
            ]
          }
        }
      ]
    },
    "clientAnnotations": {
      "isEditedByUser": true
    },
    "isRequired": true
  }
]


___TESTS___

scenarios:
- name: Test
  code: |-
    const mockData = {
      "projectId": "cp7aHGexzLgytbJoyKTI",
      "rules": [
        {
          "field": "country",
          "value": "US",
          "selector": ".price",
          "text": "$100 USD"
        }
      ]
    };

    // Call runCode to run the template's code.
    runCode(mockData);

    // Verify that the tag finished successfully.
    assertApi('gtmOnSuccess').wasCalled();


___NOTES___

Generated by templates/generate.js from templates/use-cases.js ("replace-text").
Do not edit this file directly -- edit use-cases.js and regenerate.

Depends on two CDN-hosted files loaded via injectScript, in sequence:
1. https://cdn.visitorapi.com/visitor-api.js (shared with every other
   VisitorAPI template) -- fetches visitor data.
2. https://cdn.visitorapi.com/personalize.js (from this repo's
   dist/personalize.js) -- matches rules and applies DOM actions.
