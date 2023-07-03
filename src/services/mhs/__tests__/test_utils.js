import path from 'path';
import { readFileSync } from 'fs';
import nock from 'nock';

const FAKE_AUTH_KEY = 'fake-auth-key';
const MOCK_MHS_OUTBOUND_URL = 'http://localhost/mhs-outbound';
const MOCK_SDS_FHIR_URL = 'http://localhost/sds-fhir';
const FAKE_SDS_API_KEY = 'fake-sds-api-key';
const FAKE_REPO_ASID_CODE = 'fake_repo_asid_code';
const FAKE_DEST_ASID_CODE = 'fake_dest_asid_code';
const FAKE_REPO_ODS_CODE = 'B85002';
const FAKE_DEST_ODS_CODE = 'M85019';
const TEST_NHS_NUMBER = '9876543210';

export const setupEnvVarsForTest = () => {
  process.env.API_KEY_FOR_TEST_USER = FAKE_AUTH_KEY;
  process.env.GP2GP_MESSENGER_MHS_OUTBOUND_URL = MOCK_MHS_OUTBOUND_URL;
  process.env.SDS_FHIR_URL = MOCK_SDS_FHIR_URL;
  process.env.SDS_FHIR_API_KEY = FAKE_SDS_API_KEY;
  process.env.GP2GP_MESSENGER_REPOSITORY_ASID = FAKE_REPO_ASID_CODE;
  process.env.GP2GP_MESSENGER_REPOSITORY_ODS_CODE = FAKE_REPO_ODS_CODE;
};

export const EhrMessageType = {
  core: 'core',
  fragment: 'fragment',
  coreWithLargeMedicalHistory: 'CoreWithLargeMedicalHistory'
};

// import the actual uuid package here, as there is a global jest mock for that lib in `src/__mocks__/uuid.js` used by other tests
const { v4 } = jest.requireActual('uuid');
const randomUUID = () => v4().toUpperCase();
export const generateRandomIdsForTest = () => {
  return {
    conversationId: randomUUID(),
    messageId: randomUUID(),
    ehrRequestId: randomUUID()
  };
};

export const isSmallerThan256KB = input => {
  const jsObjectAsString = typeof input == 'string' ? input : JSON.stringify(input);
  return jsObjectAsString.length < 256 * 1024;
};

export const loadMessageWithIds = (messageType, testUUIDs) => {
  const filename = `TestEhr${messageType}`;
  return loadTestFileAndFillIds(filename, testUUIDs);
};

const loadTestFileAndFillIds = (filename, { conversationId, messageId, ehrRequestId }) => {
  const filepath = path.join(__dirname, 'data', filename);
  const jsonString = readFileSync(filepath, 'utf8')
    .replaceAll('__CONVERSATION_ID__', conversationId)
    .replaceAll('__MESSAGE_ID__', messageId)
    .replaceAll('__EHR_REQUEST_ID__', ehrRequestId)
    .replaceAll('__NHS_NUMBER__', TEST_NHS_NUMBER)
    .replaceAll('__REPO_ASID_CODE__', FAKE_REPO_ASID_CODE)
    .replaceAll('__REPO_ODS_CODE__', FAKE_REPO_ODS_CODE)
    .replaceAll('__DEST_ASID_CODE__', FAKE_DEST_ASID_CODE)
    .replaceAll('__DEST_ODS_CODE__', FAKE_DEST_ODS_CODE);
  return JSON.parse(jsonString);
};

export const buildPostRequestBody = (
  messageType,
  ehrMessage,
  { conversationId, messageId, ehrRequestId }
) => {
  switch (messageType) {
    case EhrMessageType.core:
    case EhrMessageType.coreWithLargeMedicalHistory:
      return {
        conversationId,
        messageId,
        ehrRequestId,
        odsCode: FAKE_DEST_ODS_CODE,
        coreEhr: ehrMessage
      };
    case EhrMessageType.fragment:
      return {
        conversationId,
        messageId,
        odsCode: FAKE_DEST_ODS_CODE,
        fragmentMessage: ehrMessage
      };
    default:
      throw new TypeError('messageType should be either core or fragment.');
  }
};

export const createMockFhirScope = () => {
  /*
  Create a nock scope to mock the SDS FHIR api, which gp2gp messenger get ASID codes from.
  */
  const mockFhirResponse = {
    entry: [
      {
        resource: {
          identifier: [
            {
              system: 'https://fhir.nhs.uk/Id/nhsSpineASID',
              value: FAKE_DEST_ASID_CODE
            }
          ]
        }
      }
    ]
  };

  return nock(MOCK_SDS_FHIR_URL, {
    reqheaders: {
      apiKey: FAKE_SDS_API_KEY
    }
  })
    .get(`/Device`)
    .query(() => true)
    .reply(200, mockFhirResponse);
};

export const createMockMHSScope = () => {
  /*
  Create a nock scope to mock the outbound MHS adaptor.
  This function use some special trick to capture the outbound request headers and body.
  Please keep the function in .reply intact and don't change it to an arrow function.
  */
  const body = {};
  const headers = {};

  const scope = nock(MOCK_MHS_OUTBOUND_URL)
    .post('')
    .reply(function (_, requestBody) {
      Object.assign(body, requestBody);
      Object.assign(headers, this.req.headers);
      return [200, 'OK'];
    });

  scope.outboundBody = body;
  scope.outboundHeaders = headers;
  return scope;
};
