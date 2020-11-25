import { v4 as uuid } from 'uuid';
import { initialiseConfig } from '../../../config';
import { sendEhrRequest } from '../send-ehr-request';
import nock from 'nock';
import { updateLogEventWithError } from '../../../middleware/logging';

jest.mock('../../../config');
jest.mock('../../../middleware/logging');

describe('sendEhrRequest', () => {
  const conversationId = uuid();
  const nhsNumber = '1234567890';
  const odsCode = 'B12345';
  const body = { nhsNumber, conversationId, odsCode };
  const mockRepoToGpUrl = 'http://localhost';
  const mockRepoToGpAuthKeys = 'fake-keys';
  initialiseConfig.mockReturnValue({
    repoToGpAuthKeys: mockRepoToGpAuthKeys,
    repoToGpUrl: mockRepoToGpUrl
  });

  it('should make a POST request to RepoToGP with conversation id, nhs number and ods code', async () => {
    const headers = { reqheaders: { Authorization: `${mockRepoToGpAuthKeys}` } };
    nock(mockRepoToGpUrl, headers).post(`/registration-requests/`, body).reply(201);
    let error = null;
    try {
      await sendEhrRequest(nhsNumber, conversationId, odsCode);
    } catch (err) {
      error = err;
    }
    expect(error).toBeNull();
  });

  it('should log error when axios returns 503', async () => {
    const headers = { reqheaders: { Authorization: `${mockRepoToGpAuthKeys}` } };
    nock(mockRepoToGpUrl, headers).post(`/registration-requests/`, body).reply(503);
    let error = null;
    try {
      await sendEhrRequest(nhsNumber, conversationId, odsCode);
    } catch (err) {
      error = err;
    }
    expect(error).not.toBeNull();
    expect(updateLogEventWithError).toHaveBeenCalledWith({
      message: 'Cannot send EHR request to repo-to-gp: Request failed with status code 503'
    });
  });
});