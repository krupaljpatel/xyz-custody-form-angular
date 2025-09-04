import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormApiService, FormSubmission } from '../../services/form-api.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-forms-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="forms-list-container">
      <div class="header">
        <h2>XYZ Custody Forms</h2>
        <button class="btn-primary" [routerLink]="['/forms/new']">
          <i class="icon">+</i>
          Create New Form
        </button>
      </div>

      <div class="forms-grid" *ngIf="forms$ | async as forms; else loading">
        <div *ngIf="forms.length === 0" class="empty-state">
          <div class="empty-icon">📋</div>
          <h3>No Forms Yet</h3>
          <p>Create your first XYZ Custody Account Opening Form to get started.</p>
          <button class="btn-primary" [routerLink]="['/forms/new']">Create New Form</button>
        </div>

        <div *ngFor="let form of forms" class="form-card">
          <div class="form-header">
            <h3>{{ form.clientName }}</h3>
            <div class="status-badge" [class]="'status-' + form.status">
              {{ form.status | titlecase }}
            </div>
          </div>

          <div class="form-details">
            <div class="detail-item">
              <span class="label">Created:</span>
              <span class="value">{{ form.createdDate | date:'short' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Modified:</span>
              <span class="value">{{ form.lastModified | date:'short' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Progress:</span>
              <div class="progress-container">
                <div class="progress-bar">
                  <div class="progress-fill" [style.width.%]="form.completionPercentage"></div>
                </div>
                <span class="progress-text">{{ form.completionPercentage }}%</span>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button class="btn-secondary" [routerLink]="['/forms', form.id, 'view']">
              <i class="icon">👁</i>
              View
            </button>
            <button class="btn-primary" [routerLink]="['/forms', form.id, 'edit']">
              <i class="icon">✏️</i>
              Edit
            </button>
            <button class="btn-secondary" (click)="downloadForm(form)">
              <i class="icon">💾</i>
              Export
            </button>
            <button class="btn-danger" (click)="deleteForm(form)">
              <i class="icon">🗑</i>
              Delete
            </button>
          </div>
        </div>
      </div>

      <ng-template #loading>
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading forms...</p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .forms-list-container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #e0e0e0;
    }

    .header h2 {
      color: #1976d2;
      margin: 0;
      font-size: 2rem;
    }

    .forms-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 1.5rem;
    }

    .form-card {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      border: 1px solid #e0e0e0;
      transition: all 0.3s;
    }

    .form-card:hover {
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
      transform: translateY(-2px);
    }

    .form-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .form-header h3 {
      margin: 0;
      color: #333;
      font-size: 1.2rem;
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-draft {
      background-color: #fff3cd;
      color: #856404;
    }

    .status-submitted {
      background-color: #d4edda;
      color: #155724;
    }

    .status-archived {
      background-color: #f8d7da;
      color: #721c24;
    }

    .form-details {
      margin-bottom: 1.5rem;
    }

    .detail-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }

    .label {
      font-weight: 600;
      color: #666;
    }

    .value {
      color: #333;
    }

    .progress-container {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex: 1;
      justify-content: flex-end;
    }

    .progress-bar {
      width: 80px;
      height: 8px;
      background-color: #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #4caf50, #2196f3);
      transition: width 0.3s;
    }

    .progress-text {
      font-size: 0.8rem;
      font-weight: 600;
      color: #666;
      min-width: 35px;
    }

    .form-actions {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .btn-primary, .btn-secondary, .btn-danger {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 0.25rem;
      transition: all 0.3s;
      text-decoration: none;
    }

    .btn-primary {
      background-color: #1976d2;
      color: white;
    }

    .btn-primary:hover {
      background-color: #1565c0;
    }

    .btn-secondary {
      background-color: #f5f5f5;
      color: #666;
      border: 1px solid #ddd;
    }

    .btn-secondary:hover {
      background-color: #eeeeee;
    }

    .btn-danger {
      background-color: #f44336;
      color: white;
    }

    .btn-danger:hover {
      background-color: #d32f2f;
    }

    .icon {
      font-size: 1rem;
    }

    .empty-state {
      text-align: center;
      padding: 3rem;
      grid-column: 1 / -1;
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      color: #666;
      margin-bottom: 0.5rem;
    }

    .empty-state p {
      color: #999;
      margin-bottom: 2rem;
    }

    .loading-state {
      text-align: center;
      padding: 3rem;
      grid-column: 1 / -1;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #1976d2;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class FormsListComponent implements OnInit {
  private formApiService = inject(FormApiService);
  forms$: Observable<FormSubmission[]>;

  constructor() {
    this.forms$ = this.formApiService.forms$;
  }

  ngOnInit() {
    this.formApiService.loadForms();
  }

  downloadForm(form: FormSubmission) {
    this.formApiService.downloadForm(form.id, form.clientName);
  }

  deleteForm(form: FormSubmission) {
    if (confirm(`Are you sure you want to delete the form for "${form.clientName}"?`)) {
      this.formApiService.deleteForm(form.id).subscribe({
        next: () => {
          console.log('Form deleted successfully');
        },
        error: (error) => {
          console.error('Error deleting form:', error);
          alert('Error deleting form. Please try again.');
        }
      });
    }
  }
}