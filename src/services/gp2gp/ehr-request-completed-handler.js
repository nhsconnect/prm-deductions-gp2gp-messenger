import axios from 'axios';
import axiosRetry from 'axios-retry';
import config from '../../config';
import { eventFinished, updateLogEvent } from '../../middleware/logging';

axiosRetry(axios, {
  retries: 2,
  retryDelay: retryCount => {
    updateLogEvent({ status: `axios retry times: ${retryCount}` });
    eventFinished();
    return 1000;
  }
});

const _fetchStorageUrl = (conversationId, body) => {
  try {
    return axios.post(`${config.ehrRepoUrl}/health-record/${conversationId}/new/message`, body);
  } catch (err) {
    updateLogEvent({ status: 'failed to get pre-signed url', error: err.stack });
    throw err;
  } finally {
    eventFinished();
  }
};

const _setTransferComplete = async (conversationId, messageId) => {
  try {
    const response = await axios.patch(
      `${config.ehrRepoUrl}/health-record/${conversationId}/message/${messageId}`,
      {
        transferComplete: true
      }
    );
    updateLogEvent({ ehrRepository: { transferSuccessful: true } });
    return response;
  } catch (err) {
    updateLogEvent({ status: 'failed to update transfer complete to ehr repo api', error: err });
    throw err;
  }
};

const storeMessageInEhrRepo = async (url, message) => {
  try {
    const response = await axios.put(url, message);
    updateLogEvent({
      ehrRepository: { responseCode: response.status, responseMessage: response.statusText }
    });
    return response;
  } catch (err) {
    updateLogEvent({
      status: 'failed to store message to s3 via pre-signed url',
      error: err.stack
    });
    throw err;
  } finally {
    eventFinished();
  }
};

const ehrRequestCompletedHandler = async (message, soapInformation) => {
  try {
    const { data: url } = await _fetchStorageUrl(soapInformation.conversationId, soapInformation);
    updateLogEvent({ status: 'Storing EHR in s3 bucket', ehrRepository: { url } });
    await storeMessageInEhrRepo(url, message);
    await _setTransferComplete(soapInformation.conversationId, soapInformation.messageId);
  } catch (err) {
    updateLogEvent({
      status: 'failed to store message to ehr repository',
      error: err.stack
    });
  } finally {
    eventFinished();
  }
};

export { ehrRequestCompletedHandler };