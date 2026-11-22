import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
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
  private readonly destroyRef = inject(DestroyRef);

  readonly user = this.auth.currentUser;
  readonly firstName = computed(() => this.user()?.name.split(' ')[0] ?? 'User');
  readonly currentTime = signal(Date.now());
  private readonly countdownTimer = setInterval(() => {
    this.currentTime.set(Date.now());
  }, 30_000);

  readonly isAdministrator = computed(() => this.user()?.role === 'Administrator');
  readonly balanceLabel = computed(() => {
    const balance = this.user()?.balance ?? 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(balance);
  });

  readonly subscriptionExpiryLabel = computed(() => {
    const expiresAt = this.user()?.subscription?.expiresAt;
    if (!expiresAt) {
      return 'No active subscription';
    }

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(`${expiresAt}T12:00:00`));
  });

  readonly remainingTimeLabel = computed(() => {
    const expiresAt = this.user()?.subscription?.expiresAt;
    if (!expiresAt) {
      return 'No subscription';
    }

    const expiry = new Date(`${expiresAt}T23:59:59`).getTime();
    const remainingMilliseconds = expiry - this.currentTime();

    if (remainingMilliseconds <= 0) {
      return 'Expired';
    }

    const remainingMinutes = Math.ceil(remainingMilliseconds / 60_000);
    if (remainingMinutes < 60) {
      return `${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'} remaining`;
    }

    const remainingHours = Math.ceil(remainingMilliseconds / 3_600_000);
    if (remainingHours < 24) {
      return `${remainingHours} hour${remainingHours === 1 ? '' : 's'} remaining`;
    }

    const remainingDays = Math.ceil(remainingMilliseconds / 86_400_000);
    return `${remainingDays} day${remainingDays === 1 ? '' : 's'} remaining`;
  });

  readonly hasActiveSubscription = computed(() => {
    const expiresAt = this.user()?.subscription?.expiresAt;
    if (!expiresAt) {
      return false;
    }

    return new Date(`${expiresAt}T23:59:59`).getTime() > this.currentTime();
  });

  readonly connectionStatus = computed(() =>
    this.hasActiveSubscription() ? 'Connected' : 'Disconnected',
  );

  readonly managedUsers = this.auth.users.filter((item) => item.role === 'Subscriber');

  constructor() {
    this.destroyRef.onDestroy(() => clearInterval(this.countdownTimer));
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
