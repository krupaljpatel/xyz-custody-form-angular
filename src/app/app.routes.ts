import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/forms',
    pathMatch: 'full'
  },
  {
    path: 'forms',
    loadComponent: () => import('./components/forms-list/forms-list.component').then(m => m.FormsListComponent)
  },
  {
    path: 'forms/new',
    loadComponent: () => import('./components/form-editor/form-editor.component').then(m => m.FormEditorComponent)
  },
  {
    path: 'forms/:id/edit',
    loadComponent: () => import('./components/form-editor/form-editor.component').then(m => m.FormEditorComponent)
  },
  {
    path: 'forms/:id/view',
    loadComponent: () => import('./components/form-viewer/form-viewer.component').then(m => m.FormViewerComponent)
  },
  {
    path: '**',
    redirectTo: '/forms'
  }
];