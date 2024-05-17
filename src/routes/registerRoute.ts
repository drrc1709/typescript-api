import { Router } from 'express';
import multer from 'multer';
import { RegisterController } from '../controllers/RegisterController';

const upload = multer({ dest: 'uploads/' }); // Configura multer para manejo de archivos
const router = Router();
const controller = new RegisterController();

router.post('/number-or-csv', upload.single('file'), controller.handleNumberOrCsv.bind(controller));

export default router;
