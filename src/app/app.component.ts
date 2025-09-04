import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="app-container">
      <header class="app-header">
        <h1>XYZ Custody Account Opening Form</h1>
        <nav>
          <a routerLink="/forms" routerLinkActive="active">Forms List</a>
          <a routerLink="/forms/new" routerLinkActive="active">New Form</a>
        </nav>
      </header>
      <main class="app-main">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      background-color: #f5f5f5;
    }
    
    .app-header {
      background: white;
      padding: 1rem 2rem;
      border-bottom: 1px solid #e0e0e0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .app-header h1 {
      margin: 0 0 1rem 0;
      color: #1976d2;
      font-size: 1.8rem;
    }
    
    .app-header nav {
      display: flex;
      gap: 2rem;
    }
    
    .app-header nav a {
      text-decoration: none;
      color: #666;
      font-weight: 500;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      transition: all 0.3s;
    }
    
    .app-header nav a:hover,
    .app-header nav a.active {
      background-color: #1976d2;
      color: white;
    }
    
    .app-main {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }
  `]
})
export class AppComponent {
  title = 'XYZ Custody Form';
}