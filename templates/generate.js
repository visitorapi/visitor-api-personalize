#!/usr/bin/env node
// Generates the use-case-specific .tpl files from use-cases.js. The
// shared plumbing (permissions, injectScript sequencing, dataLayer
// debug events) is identical across every template and lives here,
// once, so it can't drift between copies. Only each use case's
// TEMPLATE_PARAMETERS and buildRules() (in use-cases.js) differ.

const fs = require("node:fs");
const path = require("node:path");
const { USE_CASES } = require("./use-cases");

const TERMS_OF_SERVICE = `___TERMS_OF_SERVICE___

By creating or modifying this file you agree to Google Tag Manager's Community
Template Gallery Developer Terms of Service available at
https://developers.google.com/tag-manager/gallery-tos (or such other URL as
Google may provide), as modified from time to time.
`;

function infoBlock(useCase) {
  const info = {
    type: "TAG",
    id: "cvt_temp_public_id",
    version: 1,
    securityGroups: [],
    displayName: useCase.displayName,
    categories: ["UTILITY"],
    brand: { id: "brand_dummy", displayName: "" },
    description: useCase.description,
    containerContexts: ["WEB"],
  };
  return `___INFO___\n\n${JSON.stringify(info, null, 2)}\n`;
}

function templateParametersBlock(useCase) {
  const params = [
    {
      type: "TEXT",
      name: "projectId",
      displayName: "Project ID",
      simpleValueType: true,
      help: "Your VisitorAPI project ID, from https://app.visitorapi.com.",
    },
    {
      type: "SIMPLE_TABLE",
      name: "rules",
      displayName: "Rules",
      simpleTableColumns: useCase.tableColumns,
      help: "Every matching rule runs -- there's no first-match-wins.",
    },
  ];
  return `___TEMPLATE_PARAMETERS___\n\n${JSON.stringify(params, null, 2)}\n`;
}

const SPLIT_VALUES_SOURCE = `function splitValues(raw) {
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
}`;

function sandboxedJsBlock(useCase) {
  return `___SANDBOXED_JS_FOR_WEB_TEMPLATE___

const queryPermission = require('queryPermission');
const injectScript = require('injectScript');
const copyFromWindow = require('copyFromWindow');
const createQueue = require('createQueue');

const visitorApiUrl = 'https://cdn.visitorapi.com/visitor-api.js';
const personalizeUrl = 'https://cdn.visitorapi.com/personalize.js';

${SPLIT_VALUES_SOURCE}

${useCase.buildRulesSource}

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

// visitor-api.js and personalize.js don't depend on each other, so
// they're loaded in parallel (not one injectScript inside the
// other's callback) -- personalize() only runs once BOTH the
// visitor-data fetch and the engine script have resolved, whichever
// finishes last.
var personalizeReady = false;
var visitorDataReady = false;
var visitorData = null;
var visitorDataError = null;

function tryRunPersonalize() {
  if (!personalizeReady || !visitorDataReady) {
    return;
  }
  if (visitorDataError) {
    pushDebugEvent('visitor-api-personalize-error', {
      visitorApiPersonalizeErrorCode: visitorDataError.code,
      visitorApiPersonalizeErrorMessage: visitorDataError.message
    });
    return;
  }
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
}

if (queryPermission('inject_script', personalizeUrl)) {
  injectScript(personalizeUrl, function () {
    personalizeReady = true;
    tryRunPersonalize();
  });
}

if (queryPermission('inject_script', visitorApiUrl)) {
  injectScript(visitorApiUrl, function () {
    var api = copyFromWindow('VisitorAPI');
    if (typeof api !== 'undefined') {
      api(
        data.projectId,
        function (data_) {
          visitorData = data_;
          visitorDataReady = true;
          tryRunPersonalize();
        },
        function (errorCode, errorMessage) {
          visitorDataError = { code: errorCode, message: errorMessage };
          visitorDataReady = true;
          tryRunPersonalize();
        }
      );
    }
  });
}

// Call data.gtmOnSuccess when the tag is finished.
data.gtmOnSuccess();
`;
}

function permissionsBlock() {
  const permissions = [
    {
      instance: {
        key: { publicId: "access_globals", versionId: "1" },
        param: [
          {
            key: "keys",
            value: {
              type: 2,
              listItem: [
                {
                  type: 3,
                  mapKey: [
                    { type: 1, string: "key" },
                    { type: 1, string: "read" },
                    { type: 1, string: "write" },
                    { type: 1, string: "execute" },
                  ],
                  mapValue: [
                    { type: 1, string: "VisitorAPI" },
                    { type: 8, boolean: true },
                    { type: 8, boolean: false },
                    { type: 8, boolean: true },
                  ],
                },
                {
                  type: 3,
                  mapKey: [
                    { type: 1, string: "key" },
                    { type: 1, string: "read" },
                    { type: 1, string: "write" },
                    { type: 1, string: "execute" },
                  ],
                  mapValue: [
                    { type: 1, string: "VisitorAPIPersonalize" },
                    { type: 8, boolean: true },
                    { type: 8, boolean: false },
                    { type: 8, boolean: true },
                  ],
                },
                {
                  type: 3,
                  mapKey: [
                    { type: 1, string: "key" },
                    { type: 1, string: "read" },
                    { type: 1, string: "write" },
                    { type: 1, string: "execute" },
                  ],
                  mapValue: [
                    { type: 1, string: "dataLayer" },
                    { type: 8, boolean: true },
                    { type: 8, boolean: true },
                    { type: 8, boolean: false },
                  ],
                },
              ],
            },
          },
        ],
      },
      clientAnnotations: { isEditedByUser: true },
      isRequired: true,
    },
    {
      instance: {
        key: { publicId: "inject_script", versionId: "1" },
        param: [
          {
            key: "urls",
            value: {
              type: 2,
              listItem: [
                { type: 1, string: "https://cdn.visitorapi.com/visitor-api.js" },
                { type: 1, string: "https://cdn.visitorapi.com/personalize.js" },
              ],
            },
          },
        ],
      },
      clientAnnotations: { isEditedByUser: true },
      isRequired: true,
    },
  ];
  return `___WEB_PERMISSIONS___\n\n${JSON.stringify(permissions, null, 2)}\n`;
}

function testsBlock(useCase) {
  const mockData = { projectId: "cp7aHGexzLgytbJoyKTI", rules: [useCase.testMockRow] };
  const mockDataLines = JSON.stringify(mockData, null, 2)
    .split("\n")
    .map((line) => "    " + line)
    .join("\n");
  return `___TESTS___

scenarios:
- name: Test
  code: |-
    const mockData = ${mockDataLines.trim()};

    // Call runCode to run the template's code.
    runCode(mockData);

    // Verify that the tag finished successfully.
    assertApi('gtmOnSuccess').wasCalled();
`;
}

function notesBlock(useCase) {
  return `___NOTES___

Generated by templates/generate.js from templates/use-cases.js ("${useCase.id}").
Do not edit this file directly -- edit use-cases.js and regenerate.

Depends on two CDN-hosted files loaded via injectScript, in sequence:
1. https://cdn.visitorapi.com/visitor-api.js (shared with every other
   VisitorAPI template) -- fetches visitor data.
2. https://cdn.visitorapi.com/personalize.js (from this repo's
   dist/personalize.js) -- matches rules and applies DOM actions.
`;
}

function generateTemplate(useCase) {
  return [
    TERMS_OF_SERVICE,
    infoBlock(useCase),
    templateParametersBlock(useCase),
    sandboxedJsBlock(useCase),
    permissionsBlock(),
    testsBlock(useCase),
    notesBlock(useCase),
  ].join("\n\n");
}

function main() {
  const outDir = __dirname;
  USE_CASES.forEach((useCase) => {
    const content = generateTemplate(useCase);
    fs.writeFileSync(path.join(outDir, `${useCase.id}.tpl`), content);
    console.log(`Wrote templates/${useCase.id}.tpl`);
  });
}

module.exports = { generateTemplate, SPLIT_VALUES_SOURCE };

if (require.main === module) {
  main();
}
