import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LayoutComponent } from '../../../../shared/components/layout/layout.component';
import { UserService } from '../../../../core/services/user.service';
import { User } from '../../../../core/models/auth.models';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent],
  template: `
    <app-layout>
      <div class="container">
        <div class="page-header">
          <h1>Gestion des Utilisateurs</h1>
          <p>Gérez les utilisateurs du système DGSI Maintenance</p>
        </div>

        <div class="table-container">
          <div class="table-header">
            <h2>Liste des Utilisateurs</h2>
            <div class="search-bar">
              <input type="text" placeholder="Rechercher..." [(ngModel)]="searchTerm" (input)="filterUsers()" class="search-input">
              <span class="search-icon">🔍</span>
            </div>
          </div>
          
          <div class="table-wrapper">
            <table *ngIf="filteredUsers.length > 0; else noData">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Contact</th>
                  <th>Qualification</th>
                  <th>Date de création</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let user of filteredUsers">
                  <td>{{ user.nom }}</td>
                  <td>{{ user.email }}</td>
                  <td>
                    <span class="badge" [class]="getBadgeClass(user.role)">
                      {{ getRoleLabel(user.role) }}
                    </span>
                  </td>
                  <td>{{ user.contact || '-' }}</td>
                  <td>{{ user.qualification || '-' }}</td>
                  <td>{{ formatDate(user.createdAt) }}</td>
                  <td>
                    <div class="action-buttons">
                      <button class="btn btn-secondary btn-sm" (click)="viewUser(user)">Voir</button>
                      <button class="btn btn-danger btn-sm" (click)="deleteUser(user)" [disabled]="user.id === currentUserId">Supprimer</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <ng-template #noData>
              <div class="no-data">
                <p>Aucun utilisateur trouvé</p>
              </div>
            </ng-template>
          </div>
        </div>

        <div class="loading" *ngIf="loading">
          Chargement des utilisateurs...
        </div>
      </div>
    </app-layout>
  `,
  styles: [`
    .container {
      max-width: 98%;
      margin: 0 auto;
      padding: 1rem;
    }

    .page-header {
      margin-bottom: 2rem;
    }

    .table-container {
      background: white;
      border-radius: 12px;
      overflow-x: auto;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      width: 100%;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: auto;
    }

    th, td {
      padding: 0.75rem 1rem;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
      white-space: nowrap;
    }

    th {
      background: #f9fafb;
      font-weight: 600;
    }

    tr:hover {
      background-color: #f9fafb;
    }

    .action-buttons {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      justify-content: flex-start;
      flex-wrap: nowrap;
      white-space: normal;
      min-width: 150px;
    }

    .btn-sm {
      padding: 0.5rem 0.75rem;
      font-size: 0.8rem;
      font-weight: 600;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background-color: #545b62;
    }

    .btn-danger {
      background-color: #dc3545;
      color: white;
    }

    .btn-danger:hover {
      background-color: #c82333;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.75rem;
      font-size: 0.75rem;
      font-weight: 500;
      border-radius: 9999px;
    }

    .badge-success {
      background-color: #dcfce7;
      color: #166534;
    }

    .badge-warning {
      background-color: #fef3c7;
      color: #92400e;
    }

    .badge-info {
      background-color: #dbeafe;
      color: #1e40af;
    }

    .no-data {
      text-align: center;
      padding: 3rem;
    }

    .loading {
      text-align: center;
      padding: 2rem;
      color: #6b7280;
    }

    .table-header {
      background: #f9fafb;
      padding: 1.5rem;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .table-header h2 {
      margin: 0;
      color: #1f2937;
    }

    .search-bar {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-input {
      padding: 0.5rem 2.5rem 0.5rem 1rem;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 0.875rem;
      width: 250px;
      transition: all 0.2s;
    }

    .search-input:focus {
      outline: none;
      border-color: #f97316;
      box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
    }

    .search-icon {
      position: absolute;
      right: 0.75rem;
      color: #6b7280;
      pointer-events: none;
    }
  `]
})
export class UserListComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  searchTerm = '';
  loading = false;
  currentUserId: string | null = null;

  constructor(
    private userService: UserService,
    private confirmationService: ConfirmationService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    const currentUserStr = localStorage.getItem('currentUser');
    if (currentUserStr) {
      const currentUser = JSON.parse(currentUserStr);
      this.currentUserId = currentUser.id;
    }
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.filteredUsers = users;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.loading = false;
      }
    });
  }

  filterUsers(): void {
    if (!this.searchTerm.trim()) {
      this.filteredUsers = [...this.users];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredUsers = this.users.filter(user => 
        (user.nom || '').toLowerCase().includes(term) ||
        (user.email || '').toLowerCase().includes(term) ||
        (user.contact || '').toLowerCase().includes(term) ||
        (user.role || '').toLowerCase().includes(term)
      );
    }
  }

  getBadgeClass(role: string): string {
    const roleClasses: { [key: string]: string } = {
      'ADMINISTRATEUR': 'badge-success',
      'PRESTATAIRE': 'badge-warning',
      'USER': 'badge-info'
    };
    return roleClasses[role] || 'badge-info';
  }

  getRoleLabel(role: string): string {
    const roleLabels: { [key: string]: string } = {
      'ADMINISTRATEUR': 'Administrateur',
      'PRESTATAIRE': 'Prestataire',
      'USER': 'Utilisateur'
    };
    return roleLabels[role] || role;
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR');
  }

  viewUser(user: User): void {
    // Implement user details modal/page
    console.log('View user:', user);
  }

  async deleteUser(user: User): Promise<void> {
    const confirmed = await this.confirmationService.show({
      title: 'Supprimer l\'utilisateur',
      message: `Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.nom} ?`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler'
    });

    if (confirmed) {
      this.userService.deleteUser(user.id).subscribe({
        next: () => {
          this.users = this.users.filter(u => u.id !== user.id);
          this.toastService.show({ type: 'success', title: 'Utilisateur supprimé', message: 'L\'utilisateur a été supprimé avec succès' });
        },
        error: (error) => {
          console.error('Error deleting user:', error);
          this.toastService.show({ type: 'error', title: 'Erreur', message: 'Erreur lors de la suppression de l\'utilisateur' });
        }
      });
    }
  }
}