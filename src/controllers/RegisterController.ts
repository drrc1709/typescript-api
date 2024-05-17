import { Request, Response } from 'express';
import csv from 'csv-parser';
import fs from 'fs';

export class RegisterController {
    public async handleNumberOrCsv(req: Request, res: Response): Promise<Response> {
        const { number } = req.body;
        const file = req.file;

        if (number) {
            return res.json({ message: `Received number: ${number}` });
        } else if (file) {
            const results: number[] = [];
            return new Promise((resolve, reject) => {
                fs.createReadStream(file.path)
                    .pipe(csv())
                    .on('data', (data) => {
                        results.push(Number(data.number));
                    })
                    .on('end', () => {
                        // Borrar el archivo después de procesarlo
                        fs.unlink(file.path, (err) => {
                            if (err) {
                                console.error('Error deleting the file:', err);
                            }
                        });
                        resolve(res.json({ message: `Received numbers: ${results}` }));
                    })
                    .on('error', (error) => {
                        reject(res.status(500).json({ error: 'Error processing file' }));
                    });
            });
        } else {
            return res.status(400).json({ error: 'No number or file provided' });
        }
    }
}
