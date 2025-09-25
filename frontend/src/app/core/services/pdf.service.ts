import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PdfService {
  private apiUrl = `${environment.apiUrl}/pdf`;

  constructor(private http: HttpClient) {}

  genererOrdreCommande(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/ordre-commande`, {
      responseType: 'blob'
    });
  }

  genererEvaluation(evaluationId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/evaluation/${evaluationId}`, {
      responseType: 'blob'
    });
  }

  downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}