import express, { Application, Request, Response } from 'express';
import multer from 'multer';
import { RegisterController } from './controllers/RegisterController';

const app: Application = express();
const port = process.env.PORT || 3000;

// Ensure the 'uploads/' directory exists or configure Multer to create it
const upload = multer({ dest: 'uploads/' });

// Use the built-in Express middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const numberController = new RegisterController();

// Route to handle the reception of a number or a CSV file
app.post('/number-or-csv', upload.single('file'), (req: Request, res: Response) => {
    // Validate that either a file is uploaded or a number is provided
    if (!req.file && !req.body.number) {
        return res.status(400).json({ error: 'No file or number provided' });
    }

    numberController.handleNumberOrCsv(req, res).catch(error => {
        console.error('Error handling request:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

export default app;