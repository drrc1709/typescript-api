// src/app.ts

import express, { Application } from 'express';
import bodyParser from 'body-parser';
import multer from 'multer';
import { RegisterController } from './controllers/RegisterController';

const app: Application = express();
const port = process.env.PORT || 3000;
const upload = multer({ dest: 'uploads/' });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const numberController = new RegisterController();

// Ruta para manejar la recepción de un número o un archivo CSV
app.post('/number-or-csv', upload.single('file'), (req, res) => {
    numberController.handleNumberOrCsv(req, res);
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

export default app;