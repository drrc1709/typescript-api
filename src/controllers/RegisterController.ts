import { Request, Response } from "express";
import csv from "csv-parser";
import fs from "fs";
import axios, { AxiosResponse } from "axios";

export class RegisterController {
  public async handleNumberOrCsv(
    req: Request,
    res: Response
  ): Promise<Response> {
    const { number } = req.body;
    const file = req.file;

    const sendRequest = async (url: string, data: any, headers?: any): Promise<{ requestUrl: string; requestBody: any; status: number; data: any }> => {
      try {
        const response: AxiosResponse = await axios.post(url, data, { headers });
        const requestUrl: string = response.config.url ?? 'URL no disponible';
        const requestBody: any = response.config.data;
        const status: number = response.status;
        const responseData: any = response.data;

        return { requestUrl, requestBody, status, data: responseData };
      } catch (error) {
        console.error("Error:", error);
        throw error;
      }
    };

    const sendRequests = async (num: number) => {
      const responses: { requestUrl: string; requestBody: any; status: number; data: any }[] = [];

      // Primera solicitud
      responses.push(await sendRequest("http://localhost:1080/api/send-request", { documentNumber: num, documentType: "CC", otpType: "PHONE" }));

      // Segunda solicitud, capturando el token de autorización
      const response2 = await sendRequest("http://localhost:1080/api/validate-request", { documentNumber: num, documentType: "CC", otp: "123456" });
      responses.push(response2);

      // Capturar el token de la respuesta de la segunda solicitud
      const token = response2.data.data.jwt;

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      // Tercera solicitud
      responses.push(await sendRequest("http://localhost:1080/api/username", { username: `a${num}` }, headers));

      // Cuerpo específico para la cuarta solicitud
      const body4 = {
        customerId: {
          number: num,
          type: "CC",
        },
        username: `a${num}`,
        password: "Pruebas1",
        otp: "123456",
      };

      responses.push(await sendRequest("http://localhost:1080/api/password", body4, headers));

      return responses;
    };

    if (number) {
      try {
        const responses = await sendRequests(number);
        return res.json({ responses });
      } catch (error) {
        console.error("Error processing requests:", error);
        return res
          .status(500)
          .json({ error: "Error processing requests" });
      }
    } else if (file) {
      try {
        const results: number[] = await this.processCsvFile(file.path);
        const allResponses = [];
        for (const num of results) {
          try {
            const responses = await sendRequests(num);
            allResponses.push(...responses);
          } catch (error) {
            console.error("Error processing request for number:", num, error);
            // Handle individual request errors, e.g., continue with the next number
          }
        }
        return res.json({
          message: `Received numbers: ${results}`,
          responses: allResponses,
        });
      } catch (error) {
        console.error("Error processing file:", error);
        return res.status(500).json({ error: "Error processing file" });
      }
    } else {
      return res.status(400).json({ error: "No number or file provided" });
    }
  }

  private async processCsvFile(filePath: string): Promise<number[]> {
    const results: number[] = [];
    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (data) => results.push(Number(data.number)))
        .on("end", () => {
          fs.unlink(filePath, (err) => {
            if (err) {
              console.error("Error deleting the file:", err);
              reject(err);
            } else {
              resolve(results);
            }
          });
        })
        .on("error", (error) => reject(error));
    });
  }
}