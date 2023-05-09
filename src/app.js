import express from 'express';
import { errorLogger, logger as requestLogger } from 'express-winston';
import swaggerUi from 'swagger-ui-express';
import error from './api/error';
import healthCheck from './api/health';
import { healthRecordRequestRouter } from './api/health-record-requests';
import { patientDemographicsRouter } from './api/patient-demographics';
import { healthRecordTransferRouter } from './api/health-record-transfers';
import { ehrOutRouter } from './api/ehr-out';
import { options } from './config/logging';
import * as logging from './middleware/logging';
import swaggerDocument from './swagger.json';
import helmet from 'helmet';

const app = express();

app.disable('x-powered-by');
app.use(express.json());
app.use(requestLogger(options));
// Sets "Strict-Transport-Security: max-age=31536000; includeSubDomains"
app.use(
  helmet.hsts({
    maxAge: 31536000
  })
);
app.use('/health', logging.middleware, healthCheck);
app.use('/error', logging.middleware, error);
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/patient-demographics', logging.middleware, patientDemographicsRouter);
app.use('/health-record-requests', logging.middleware, healthRecordRequestRouter);
app.use('/health-record-transfers', logging.middleware, healthRecordTransferRouter);
app.use('/ehr-out-transfers', logging.middleware, ehrOutRouter);

app.use(errorLogger(options));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});

export default app;
