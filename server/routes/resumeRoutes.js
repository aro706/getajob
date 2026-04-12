import express from 'express';
import multer from 'multer';
import { 
  uploadResume, 
  triggerPipeline, 
  updateResumeDetails,
  matchRolesForResume,
  discoverCompaniesForRole,
  processManualOutreach
} from '../controllers/resumeController.js';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/upload', upload.single('resume'), uploadResume);
router.put('/update', updateResumeDetails);
router.post('/trigger-pipeline', triggerPipeline);

router.post('/match-roles', matchRolesForResume);
router.post('/discover-companies', discoverCompaniesForRole);
router.post('/process-manual-outreach', processManualOutreach);

export default router;