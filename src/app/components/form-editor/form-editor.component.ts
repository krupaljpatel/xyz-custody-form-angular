import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FormApiService, FormSubmission } from '../../services/form-api.service';
import { HttpClient } from '@angular/common/http';

interface FormMetadata {
  formTitle: string;
  tabs: any[];
}

@Component({
  selector: 'app-form-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="form-editor-container">
      <div class="editor-header">
        <h2>{{ isEditMode ? 'Edit Form' : 'Create New Form' }}</h2>
        <div class="header-actions">
          <button type="button" class="btn-secondary" (click)="goBack()">
            ← Back to Forms
          </button>
          <button type="button" class="btn-primary" (click)="saveForm()" [disabled]="!formGroup.valid">
            💾 {{ isEditMode ? 'Update' : 'Save' }} Form
          </button>
        </div>
      </div>

      <div class="form-content" *ngIf="metadata">
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
            <form [formGroup]="formGroup" class="form-sections">
              <div *ngFor="let section of activeTab.sections" class="form-section">
                <h3 class="section-title">{{ section.number }}. {{ section.title }}</h3>
                
                <div class="section-fields">
                  <div *ngFor="let field of section.fields" class="field-container">
                    <div 
                      class="field-wrapper" 
                      [style.display]="shouldShowField(field) ? 'block' : 'none'">
                      
                      <!-- Text Input -->
                      <div *ngIf="field.type === 'text'" class="form-field">
                        <label [for]="field.name">{{ field.label }}</label>
                        <input 
                          [id]="field.name"
                          type="text" 
                          [formControlName]="field.name"
                          [placeholder]="field.helpText || ''"
                          [maxlength]="field.maxLength || 500">
                        <small *ngIf="field.helpText" class="help-text">{{ field.helpText }}</small>
                      </div>

                      <!-- Textarea -->
                      <div *ngIf="field.type === 'textarea'" class="form-field">
                        <label [for]="field.name">{{ field.label }}</label>
                        <textarea 
                          [id]="field.name"
                          [formControlName]="field.name"
                          [placeholder]="field.helpText || ''"
                          rows="3"
                          [maxlength]="field.maxLength || 1000"></textarea>
                        <small *ngIf="field.helpText" class="help-text">{{ field.helpText }}</small>
                      </div>

                      <!-- Radio Buttons -->
                      <div *ngIf="field.type === 'radio'" class="form-field">
                        <label class="field-label">{{ field.label }}</label>
                        <div class="radio-group">
                          <label *ngFor="let option of field.options" class="radio-option">
                            <input 
                              type="radio" 
                              [formControlName]="field.name"
                              [value]="option">
                            <span>{{ option }}</span>
                          </label>
                        </div>
                        <small *ngIf="field.helpText" class="help-text">{{ field.helpText }}</small>
                      </div>

                      <!-- Checkbox -->
                      <div *ngIf="field.type === 'checkbox'" class="form-field">
                        <label class="checkbox-label">
                          <input 
                            type="checkbox" 
                            [formControlName]="field.name">
                          <span>{{ field.label }}</span>
                        </label>
                        <small *ngIf="field.helpText" class="help-text">{{ field.helpText }}</small>
                      </div>

                      <!-- Dropdown -->
                      <div *ngIf="field.type === 'dropdown'" class="form-field">
                        <label [for]="field.name">{{ field.label }}</label>
                        <select [id]="field.name" [formControlName]="field.name">
                          <option value="">Select an option...</option>
                          <option *ngFor="let option of field.options" [value]="option">{{ option }}</option>
                        </select>
                        <small *ngIf="field.helpText" class="help-text">{{ field.helpText }}</small>
                      </div>

                      <!-- Multiselect -->
                      <div *ngIf="field.type === 'multiselect'" class="form-field">
                        <label class="field-label">{{ field.label }}</label>
                        <div class="multiselect-group">
                          <label *ngFor="let option of field.options" class="checkbox-option">
                            <input 
                              type="checkbox" 
                              [value]="option"
                              (change)="onMultiselectChange(field.name, option, $event)">
                            <span>{{ option }}</span>
                          </label>
                        </div>
                        <small *ngIf="field.helpText" class="help-text">{{ field.helpText }}</small>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div *ngIf="!metadata" class="loading-state">
        <div class="spinner"></div>
        <p>Loading form structure...</p>
      </div>
    </div>
  `,
  styles: [`
    .form-editor-container {
      max-width: 1000px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    .editor-header {
      background: #1976d2;
      color: white;
      padding: 1.5rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .editor-header h2 {
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
      background-color: #4caf50;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: #45a049;
    }

    .btn-primary:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
    }

    .btn-secondary {
      background-color: rgba(255,255,255,0.2);
      color: white;
      border: 1px solid rgba(255,255,255,0.3);
    }

    .btn-secondary:hover {
      background-color: rgba(255,255,255,0.3);
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
      color: #1976d2;
      border-bottom-color: #1976d2;
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
      color: #1976d2;
      font-size: 1.2rem;
      border-bottom: 2px solid #e0e0e0;
      padding-bottom: 0.5rem;
    }

    .section-fields {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-field label,
    .field-label {
      font-weight: 600;
      color: #333;
    }

    .form-field input[type="text"],
    .form-field textarea,
    .form-field select {
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
    }

    .form-field input[type="text"]:focus,
    .form-field textarea:focus,
    .form-field select:focus {
      outline: none;
      border-color: #1976d2;
      box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
    }

    .radio-group,
    .multiselect-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    .radio-option,
    .checkbox-option,
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      font-weight: normal;
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
export class FormEditorComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private formApiService = inject(FormApiService);

  formGroup: FormGroup = this.fb.group({});
  metadata: FormMetadata | null = null;
  activeTabIndex = 0;
  isEditMode = false;
  formId: string | null = null;

  get activeTab() {
    return this.metadata?.tabs[this.activeTabIndex];
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.formId = params['id'];
      this.isEditMode = !!this.formId;
    });

    this.loadFormMetadata();
  }

  loadFormMetadata() {
    this.http.get<FormMetadata>('/form-metadata.json').subscribe({
      next: (metadata) => {
        this.metadata = metadata;
        this.setupForm();
        if (this.isEditMode && this.formId) {
          this.loadExistingForm();
        }
      },
      error: (error) => {
        console.error('Error loading form metadata:', error);
        alert('Error loading form structure. Please refresh the page.');
      }
    });
  }

  setupForm() {
    if (!this.metadata) return;

    const formControls: { [key: string]: any } = {};

    this.metadata.tabs.forEach(tab => {
      tab.sections?.forEach((section: any) => {
        section.fields?.forEach((field: any) => {
          const validators = field.required ? [Validators.required] : [];
          
          if (field.type === 'multiselect') {
            formControls[field.name] = this.fb.control([], validators);
          } else {
            formControls[field.name] = this.fb.control('', validators);
          }
        });
      });
    });

    this.formGroup = this.fb.group(formControls);

    // Subscribe to form changes for conditional logic
    this.formGroup.valueChanges.subscribe(() => {
      // Trigger auto-save after 5 seconds of inactivity
      if (this.isEditMode && this.formId) {
        this.formApiService.autoSave(this.formId, this.formGroup.value);
      }
    });
  }

  loadExistingForm() {
    if (!this.formId) return;

    this.formApiService.getForm(this.formId).subscribe({
      next: (form) => {
        if (form?.formData) {
          // Flatten the nested form data structure
          const flatData: any = {};
          Object.keys(form.formData).forEach(section => {
            if (typeof form.formData[section] === 'object') {
              Object.assign(flatData, form.formData[section]);
            }
          });
          this.formGroup.patchValue(flatData);
        }
      },
      error: (error) => {
        console.error('Error loading form:', error);
        alert('Error loading form data.');
      }
    });
  }

  switchTab(index: number) {
    this.activeTabIndex = index;
  }

  shouldShowField(field: any): boolean {
    if (!field.conditional) return true;

    const condition = field.conditional;
    const fieldValue = this.formGroup.get(condition.field)?.value;

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

  onMultiselectChange(fieldName: string, option: string, event: any) {
    const control = this.formGroup.get(fieldName);
    if (!control) return;

    const currentValue = control.value || [];
    if (event.target.checked) {
      control.setValue([...currentValue, option]);
    } else {
      control.setValue(currentValue.filter((v: string) => v !== option));
    }
  }

  saveForm() {
    if (!this.formGroup.valid) {
      alert('Please fill in all required fields.');
      return;
    }

    const formData = this.prepareFormData();

    if (this.isEditMode && this.formId) {
      this.formApiService.updateForm(this.formId, formData).subscribe({
        next: () => {
          alert('Form updated successfully!');
          this.router.navigate(['/forms']);
        },
        error: (error) => {
          console.error('Error updating form:', error);
          alert('Error updating form. Please try again.');
        }
      });
    } else {
      this.formApiService.createForm(formData).subscribe({
        next: () => {
          alert('Form created successfully!');
          this.router.navigate(['/forms']);
        },
        error: (error) => {
          console.error('Error creating form:', error);
          alert('Error creating form. Please try again.');
        }
      });
    }
  }

  prepareFormData(): Partial<FormSubmission> {
    const formValue = this.formGroup.value;
    
    // Extract client name from the form
    const clientName = formValue.newAccountNameLegal || formValue.clientName || 'Unnamed Client';
    
    // Calculate completion percentage
    const completionPercentage = this.formApiService.calculateCompletionPercentage(formValue);
    
    // Group form data by sections (this is a simplified approach)
    const formData = {
      section1: {},
      section2: {},
      section3: {},
      // ... other sections would be populated based on metadata structure
    };

    // For now, put all form data in a general object
    Object.assign(formData, { formFields: formValue });

    return {
      clientName,
      status: completionPercentage === 100 ? 'submitted' : 'draft',
      completionPercentage,
      formData
    };
  }

  goBack() {
    this.router.navigate(['/forms']);
  }
}