import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormApiService, FormSubmission } from '../../services/form-api.service';
import { HttpClient } from '@angular/common/http';

interface FormMetadata {
  formTitle: string;
  tabs: any[];
}

@Component({
  selector: 'app-form-viewer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="form-viewer-container">
      <div class="viewer-header">
        <h2>{{ formData?.clientName || 'View Form' }}</h2>
        <div class="header-actions">
          <button type="button" class="btn-secondary" (click)="goBack()">
            ← Back to Forms
          </button>
          <button type="button" class="btn-secondary" (click)="editForm()">
            ✏️ Edit Form
          </button>
          <button type="button" class="btn-primary" (click)="exportForm()">
            💾 Export
          </button>
        </div>
      </div>

      <div class="form-info" *ngIf="formData">
        <div class="info-grid">
          <div class="info-item">
            <span class="label">Status:</span>
            <span class="status-badge" [class]="'status-' + formData.status">
              {{ formData.status | titlecase }}
            </span>
          </div>
          <div class="info-item">
            <span class="label">Progress:</span>
            <div class="progress-container">
              <div class="progress-bar">
                <div class="progress-fill" [style.width.%]="formData.completionPercentage"></div>
              </div>
              <span class="progress-text">{{ formData.completionPercentage }}%</span>
            </div>
          </div>
          <div class="info-item">
            <span class="label">Created:</span>
            <span class="value">{{ formData.createdDate | date:'full' }}</span>
          </div>
          <div class="info-item">
            <span class="label">Last Modified:</span>
            <span class="value">{{ formData.lastModified | date:'full' }}</span>
          </div>
        </div>
      </div>

      <div class="form-content" *ngIf="metadata && formData">
        <div class="tabs-container">
          <div class="tabs">
            <button 
              *ngFor="let tab of metadata.tabs; let i = index" 
              class="tab-button"
              [class.active]="activeTabIndex === i"
              (click)="switchTab(i)">
              {{ tab.name }}
            </button>
          </div>
        </div>

        <div class="tab-content">
          <div *ngIf="activeTab" class="tab-panel">
            <div class="form-sections">
              <div *ngFor="let section of activeTab.sections" class="form-section">
                <h3 class="section-title">{{ section.number }}. {{ section.title }}</h3>
                
                <div class="section-fields">
                  <div *ngFor="let field of section.fields" class="field-container">
                    <div 
                      class="field-wrapper" 
                      [style.display]="shouldShowField(field) ? 'block' : 'none'">
                      
                      <div class="view-field">
                        <label class="field-label">{{ field.label }}</label>
                        <div class="field-value">
                          
                          <!-- Text/Textarea Display -->
                          <span *ngIf="field.type === 'text' || field.type === 'textarea'" 
                                class="text-value">
                            {{ getFieldValue(field.name) || '-' }}
                          </span>

                          <!-- Radio Display -->
                          <span *ngIf="field.type === 'radio'" 
                                class="radio-value">
                            {{ getFieldValue(field.name) || 'Not selected' }}
                          </span>

                          <!-- Checkbox Display -->
                          <span *ngIf="field.type === 'checkbox'" 
                                class="checkbox-value">
                            <span class="checkbox-indicator" 
                                  [class.checked]="getFieldValue(field.name)">
                              {{ getFieldValue(field.name) ? '✓' : '✗' }}
                            </span>
                            {{ getFieldValue(field.name) ? 'Yes' : 'No' }}
                          </span>

                          <!-- Dropdown Display -->
                          <span *ngIf="field.type === 'dropdown'" 
                                class="dropdown-value">
                            {{ getFieldValue(field.name) || 'Not selected' }}
                          </span>

                          <!-- Multiselect Display -->
                          <div *ngIf="field.type === 'multiselect'" 
                               class="multiselect-value">
                            <div *ngIf="getFieldValue(field.name)?.length > 0; else noSelection">
                              <span *ngFor="let item of getFieldValue(field.name); let last = last" 
                                    class="multiselect-item">
                                {{ item }}<span *ngIf="!last">, </span>
                              </span>
                            </div>
                            <ng-template #noSelection>
                              <span class="no-selection">No items selected</span>
                            </ng-template>
                          </div>

                        </div>
                        <small *ngIf="field.helpText" class="help-text">{{ field.helpText }}</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="!metadata || !formData" class="loading-state">
        <div class="spinner"></div>
        <p>Loading form data...</p>
      </div>
    </div>
  `,
  styles: [`
    .form-viewer-container {
      max-width: 1000px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    .viewer-header {
      background: #2e7d32;
      color: white;
      padding: 1.5rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .viewer-header h2 {
      margin: 0;
      font-size: 1.5rem;
    }

    .header-actions {
      display: flex;
      gap: 1rem;
    }

    .btn-primary, .btn-secondary {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.3s;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-primary {
      background-color: #1976d2;
      color: white;
    }

    .btn-primary:hover {
      background-color: #1565c0;
    }

    .btn-secondary {
      background-color: rgba(255,255,255,0.2);
      color: white;
      border: 1px solid rgba(255,255,255,0.3);
    }

    .btn-secondary:hover {
      background-color: rgba(255,255,255,0.3);
    }

    .form-info {
      background: #f8f9fa;
      border-bottom: 1px solid #e0e0e0;
      padding: 1.5rem 2rem;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .info-item .label {
      font-weight: 600;
      color: #666;
      min-width: 80px;
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

    .progress-container {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .progress-bar {
      width: 100px;
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
      font-size: 0.9rem;
      font-weight: 600;
      color: #666;
    }

    .tabs-container {
      border-bottom: 1px solid #e0e0e0;
    }

    .tabs {
      display: flex;
      background-color: #f5f5f5;
    }

    .tab-button {
      padding: 1rem 2rem;
      border: none;
      background: none;
      cursor: pointer;
      font-weight: 500;
      color: #666;
      border-bottom: 3px solid transparent;
      transition: all 0.3s;
    }

    .tab-button:hover {
      background-color: #eeeeee;
    }

    .tab-button.active {
      background-color: white;
      color: #2e7d32;
      border-bottom-color: #2e7d32;
    }

    .tab-content {
      padding: 2rem;
    }

    .form-sections {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .form-section {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 1.5rem;
      background-color: #fafafa;
    }

    .section-title {
      margin: 0 0 1.5rem 0;
      color: #2e7d32;
      font-size: 1.2rem;
      border-bottom: 2px solid #e0e0e0;
      padding-bottom: 0.5rem;
    }

    .section-fields {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .view-field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .field-label {
      font-weight: 600;
      color: #333;
      font-size: 0.95rem;
    }

    .field-value {
      padding: 0.75rem;
      background: white;
      border: 1px solid #ddd;
      border-radius: 4px;
      min-height: 1.5rem;
      display: flex;
      align-items: center;
    }

    .text-value, .radio-value, .dropdown-value {
      font-weight: 500;
      color: #333;
    }

    .checkbox-value {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .checkbox-indicator {
      width: 20px;
      height: 20px;
      border: 2px solid #ddd;
      border-radius: 3px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
    }

    .checkbox-indicator.checked {
      background-color: #4caf50;
      border-color: #4caf50;
      color: white;
    }

    .multiselect-value {
      flex-wrap: wrap;
      gap: 0.25rem;
    }

    .multiselect-item {
      background-color: #e3f2fd;
      color: #1976d2;
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .no-selection {
      color: #999;
      font-style: italic;
    }

    .help-text {
      color: #666;
      font-size: 0.9rem;
      font-style: italic;
    }

    .loading-state {
      text-align: center;
      padding: 3rem;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #2e7d32;
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
export class FormViewerComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private formApiService = inject(FormApiService);

  formData: FormSubmission | null = null;
  metadata: FormMetadata | null = null;
  activeTabIndex = 0;
  formId: string | null = null;

  get activeTab() {
    return this.metadata?.tabs[this.activeTabIndex];
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.formId = params['id'];
      this.loadFormData();
      this.loadFormMetadata();
    });
  }

  loadFormData() {
    if (!this.formId) return;

    this.formApiService.getForm(this.formId).subscribe({
      next: (form) => {
        this.formData = form;
      },
      error: (error) => {
        console.error('Error loading form:', error);
        alert('Error loading form data.');
        this.router.navigate(['/forms']);
      }
    });
  }

  loadFormMetadata() {
    this.http.get<FormMetadata>('/form-metadata.json').subscribe({
      next: (metadata) => {
        this.metadata = metadata;
      },
      error: (error) => {
        console.error('Error loading form metadata:', error);
      }
    });
  }

  switchTab(index: number) {
    this.activeTabIndex = index;
  }

  shouldShowField(field: any): boolean {
    if (!field.conditional || !this.formData) return true;

    const condition = field.conditional;
    const fieldValue = this.getFieldValue(condition.field);

    switch (condition.operator) {
      case 'equals':
        return condition.showWhen ? fieldValue === condition.value : fieldValue !== condition.value;
      case 'in':
        const isInArray = Array.isArray(condition.value) && condition.value.includes(fieldValue);
        return condition.showWhen ? isInArray : !isInArray;
      case 'not_equals':
        return condition.showWhen ? fieldValue !== condition.value : fieldValue === condition.value;
      default:
        return true;
    }
  }

  getFieldValue(fieldName: string): any {
    if (!this.formData?.formData) return null;

    // First try to get from the flattened formFields
    if (this.formData.formData.formFields && this.formData.formData.formFields[fieldName]) {
      return this.formData.formData.formFields[fieldName];
    }

    // Then try to search through sections
    for (const section of Object.values(this.formData.formData)) {
      if (typeof section === 'object' && section !== null && fieldName in section) {
        return (section as any)[fieldName];
      }
    }

    return null;
  }

  editForm() {
    if (this.formId) {
      this.router.navigate(['/forms', this.formId, 'edit']);
    }
  }

  exportForm() {
    if (this.formData) {
      this.formApiService.downloadForm(this.formData.id, this.formData.clientName);
    }
  }

  goBack() {
    this.router.navigate(['/forms']);
  }
}