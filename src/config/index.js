const config = {
  deductionsAsid: process.env.DEDUCTIONS_ASID || '200000001161',
  deductionsOdsCode: process.env.DEDUCTIONS_ODS_CODE || 'B86041',
  queueName: process.env.MHS_QUEUE_NAME,
  dlqName: process.env.MHS_DLQ_NAME,
  queueUrls: [process.env.MHS_QUEUE_URL_1, process.env.MHS_QUEUE_URL_2],
  stompVirtualHost: process.env.MHS_STOMP_VIRTUAL_HOST,
  queueUsername: process.env.MHS_QUEUE_USERNAME,
  queuePassword: process.env.MHS_QUEUE_PASSWORD,
  awsS3BucketName: process.env.S3_BUCKET_NAME,
  ehrRepoUrl: process.env.EHR_REPO_URL,
  pdsAsid: process.env.PDS_ASID || '928942012545',
  mhsOutboundUrl: process.env.MHS_OUTBOUND_URL,
  url: !process.env.NHS_ENVIRONMENT
    ? `http://127.0.0.1:3000`
    : `https://${process.env.NHS_ENVIRONMENT}.gp2gp-adaptor.patient-deductions.nhs.uk`
};

export default config;
