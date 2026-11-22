import { Injectable, signal } from '@angular/core';

export interface MockSubscription {
  planCode: 'UNLI50' | 'UNLI100';
  planName: 'Unli50' | 'Unli100';
  duration: '1 week' | '2 weeks';
  startedAt: string;
  expiresAt: string;
  dataAllowance: 'Unlimited 50 Mbps' | 'Unlimited 100 Mbps';
  speedLimitMbps: number;
}

export interface MockUser {
  username: string;
  password: string;
  name: string;
  role: 'Administrator' | 'Subscriber';
  department: string;
  email: string;
  balance: number;
  phone: string;
  macAddress: string;
  subscription: MockSubscription | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly subscriptionPlans: readonly MockSubscription[] = [
    {
      planCode: 'UNLI50',
      planName: 'Unli50',
      duration: '1 week',
      startedAt: '2026-11-16',
      expiresAt: '2026-11-23',
      dataAllowance: 'Unlimited 50 Mbps',
      speedLimitMbps: 50,
    },
    {
      planCode: 'UNLI100',
      planName: 'Unli100',
      duration: '2 weeks',
      startedAt: '2026-11-09',
      expiresAt: '2026-11-23',
      dataAllowance: 'Unlimited 100 Mbps',
      speedLimitMbps: 100,
    },
  ];

  readonly users: readonly MockUser[] = [
    {
      username: 'admin1234',
      password: 'a134sg51',
      name: 'Admin',
      role: 'Administrator',
      department: 'IT Operations',
      email: 'admin@iconnect.local',
      balance: 125000,
      phone: '0917-000-0001',
      macAddress: '00:11:22:33:44:01',
      subscription: null,
    },
    {
      username: 'jdoe',
      password: 'welcome123',
      name: 'Jane Doe',
      role: 'Subscriber',
      department: 'Human Resources',
      email: 'jane.doe@iconnect.local',
      balance: 24850,
      phone: '0917-000-0002',
      macAddress: '00:11:22:33:44:02',
      subscription: null,
    },
    {
      username: 'mgarcia',
      password: 'iconnect2026',
      name: 'Miguel Garcia',
      role: 'Subscriber',
      department: 'Finance',
      email: 'miguel.garcia@iconnect.local',
      balance: 18720,
      phone: '0917-000-0003',
      macAddress: '00:11:22:33:44:03',
      subscription: {
        planCode: 'UNLI50',
        planName: 'Unli50',
        duration: '1 week',
        startedAt: '2026-11-16',
        expiresAt: '2026-11-23',
        dataAllowance: 'Unlimited 50 Mbps',
        speedLimitMbps: 50,
      },
    },
    {
      username: 'lcruz',
      password: 'subscriber123',
      name: 'Luis Cruz',
      role: 'Subscriber',
      department: 'Sales',
      email: 'luis.cruz@iconnect.local',
      balance: 15200,
      phone: '0917-000-0004',
      macAddress: '00:11:22:33:44:04',
      subscription: {
        planCode: 'UNLI50',
        planName: 'Unli50',
        duration: '1 week',
        startedAt: '2026-11-22',
        expiresAt: '2026-11-23',
        dataAllowance: 'Unlimited 50 Mbps',
        speedLimitMbps: 50,
      },
    },
    {
      username: 'rlopez',
      password: 'subscriber100',
      name: 'Rosa Lopez',
      role: 'Subscriber',
      department: 'Customer Service',
      email: 'rosa.lopez@iconnect.local',
      balance: 32100,
      phone: '0917-000-0005',
      macAddress: '00:11:22:33:44:05',
      subscription: {
        planCode: 'UNLI100',
        planName: 'Unli100',
        duration: '2 weeks',
        startedAt: '2026-11-16',
        expiresAt: '2026-11-30',
        dataAllowance: 'Unlimited 100 Mbps',
        speedLimitMbps: 100,
      },
    },
  ];

  readonly currentUser = signal<MockUser | null>(null);

  login(username: string, password: string): MockUser | null {
    const user = this.users.find(
      (item) => item.username === username.trim() && item.password === password,
    );

    if (!user) {
      return null;
    }

    this.currentUser.set(user);
    return user;
  }

  logout(): void {
    this.currentUser.set(null);
  }
}
