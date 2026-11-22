import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly user = this.auth.currentUser;
  readonly firstName = computed(() => this.user()?.name.split(' ')[0] ?? 'User');
  readonly isAdministrator = computed(() => this.user()?.role === 'Administrator');
  readonly balanceLabel = computed(() => {
    const balance = this.user()?.balance ?? 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(balance);
  });

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
