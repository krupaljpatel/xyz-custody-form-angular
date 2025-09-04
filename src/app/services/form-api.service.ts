import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface FormSubmission {
  id: string;
  clientName: string;
  createdDate: string;
  lastModified: string;
  status: 'draft' | 'submitted' | 'archived';
  completionPercentage: number;
  formData?: any;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FormApiService {
  private readonly baseUrl = '/api';
  private formsSubject = new BehaviorSubject<FormSubmission[]>([]);
  public forms$ = this.formsSubject.asObservable();

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(private http: HttpClient) {
    this.loadForms();
  }

  /**
   * Get server health status
   */
  getHealth(): Observable<any> {
    return this.http.get(`${this.baseUrl}/health`);
  }

  /**
   * Load all forms and update the forms subject
   */
  loadForms(): void {
    this.getAllForms().subscribe({
      next: (forms) => this.formsSubject.next(forms),
      error: (error) => {
        console.error('Error loading forms:', error);
        this.formsSubject.next([]);
      }
    });
  }

  /**
   * Get all forms (list view)
   */
  getAllForms(): Observable<FormSubmission[]> {
    return this.http.get<FormSubmission[]>(`${this.baseUrl}/forms`)
      .pipe(
        catchError(this.handleError<FormSubmission[]>('getAllForms', []))
      );
  }

  /**
   * Get specific form by ID
   */
  getForm(id: string): Observable<FormSubmission | null> {
    return this.http.get<FormSubmission>(`${this.baseUrl}/forms/${id}`)
      .pipe(
        catchError(this.handleError<FormSubmission>('getForm'))
      );
  }

  /**
   * Create new form
   */
  createForm(formData: Partial<FormSubmission>): Observable<ApiResponse<{id: string, clientName: string}>> {
    return this.http.post<ApiResponse<{id: string, clientName: string}>>(
      `${this.baseUrl}/forms`, 
      formData, 
      this.httpOptions
    ).pipe(
      map(response => {
        this.loadForms(); // Refresh forms list
        return response;
      }),
      catchError(this.handleError<ApiResponse<{id: string, clientName: string}>>('createForm'))
    );
  }

  /**
   * Update existing form
   */
  updateForm(id: string, formData: Partial<FormSubmission>): Observable<ApiResponse<{id: string, clientName: string}>> {
    return this.http.put<ApiResponse<{id: string, clientName: string}>>(
      `${this.baseUrl}/forms/${id}`, 
      formData, 
      this.httpOptions
    ).pipe(
      map(response => {
        this.loadForms(); // Refresh forms list
        return response;
      }),
      catchError(this.handleError<ApiResponse<{id: string, clientName: string}>>('updateForm'))
    );
  }

  /**
   * Delete form
   */
  deleteForm(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/forms/${id}`)
      .pipe(
        map(response => {
          this.loadForms(); // Refresh forms list
          return response;
        }),
        catchError(this.handleError<ApiResponse<any>>('deleteForm'))
      );
  }

  /**
   * Export form as downloadable JSON file
   */
  exportForm(id: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/forms/${id}/export`, { 
      responseType: 'blob',
      headers: new HttpHeaders({
        'Accept': 'application/json'
      })
    }).pipe(
      catchError(this.handleError<Blob>('exportForm'))
    );
  }

  /**
   * Download exported form
   */
  downloadForm(id: string, clientName: string): void {
    this.exportForm(id).subscribe({
      next: (blob) => {
        if (blob) {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `xyz-custody-form-${clientName.replace(/[^a-zA-Z0-9]/g, '_')}-${id.substring(0, 8)}.json`;
          link.click();
          window.URL.revokeObjectURL(url);
        }
      },
      error: (error) => console.error('Error downloading form:', error)
    });
  }

  /**
   * Calculate form completion percentage based on filled fields
   */
  calculateCompletionPercentage(formData: any): number {
    if (!formData || typeof formData !== 'object') {
      return 0;
    }

    let totalFields = 0;
    let filledFields = 0;

    const countFields = (obj: any): void => {
      Object.keys(obj).forEach(key => {
        if (obj[key] !== null && obj[key] !== undefined) {
          totalFields++;
          if (typeof obj[key] === 'string' && obj[key].trim() !== '') {
            filledFields++;
          } else if (typeof obj[key] === 'boolean' && obj[key]) {
            filledFields++;
          } else if (Array.isArray(obj[key]) && obj[key].length > 0) {
            filledFields++;
          } else if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
            countFields(obj[key]);
          }
        }
      });
    };

    countFields(formData);
    return totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
  }

  /**
   * Auto-save form (debounced)
   */
  private autoSaveTimeout: any;
  autoSave(id: string, formData: any, delay: number = 5000): void {
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }

    this.autoSaveTimeout = setTimeout(() => {
      const completionPercentage = this.calculateCompletionPercentage(formData);
      this.updateForm(id, { 
        formData, 
        completionPercentage,
        status: completionPercentage === 100 ? 'submitted' : 'draft'
      }).subscribe({
        next: () => console.log('Form auto-saved'),
        error: (error) => console.error('Auto-save failed:', error)
      });
    }, delay);
  }

  /**
   * Generic error handler
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      
      // Let the app keep running by returning an empty result
      return new Observable(observer => {
        observer.next(result as T);
        observer.complete();
      });
    };
  }
}