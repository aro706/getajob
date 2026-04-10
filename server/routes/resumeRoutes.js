import express from 'express';
import multer from 'multer';
import { 
  uploadResume, 
  triggerPipeline, 
  updateResumeDetails 
} from '../controllers/resumeController.js';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Button 1: Upload & Parse PDF (FormData)
router.post('/upload', upload.single('resume'), uploadResume);

// Button 1.5 (Optional): User edits details on frontend and saves (JSON)
router.put('/update', updateResumeDetails);

// Button 2: Start the Match & Email Pipeline (JSON)
router.post('/trigger-pipeline', triggerPipeline);

export default router;