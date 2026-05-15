from app.jobs.polling_job import PollingJob
from app.services.firebase_service import datastore

polling_job = PollingJob(datastore)
