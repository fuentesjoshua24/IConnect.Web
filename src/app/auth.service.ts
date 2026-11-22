import { Injectable, signal } from '@angular/core';

export interface MockUser {
  username: string;
  password: string;
  name: string;
  role: 'Administrator' | 'Subscriber';
  department: string;
  email: string;
  balance: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storageKey = 'iconnect_current_user';
  readonly users: readonly MockUser[] = [
    {
      username: 'admin1234',
      password: 'a134sg51',
      name: 'Admin',
      role: 'Administrator',
      department: 'IT Operations',
      email: 'admin@iconnect.local',
      balance: 125000,
    },
    {
      username: 'jdoe',
      password: 'welcome123',
      name: 'Jane Doe',
      role: 'Subscriber',
      department: 'Human Resources',
      email: 'jane.doe@iconnect.local',
      balance: 24850,
    },
    {
      username: 'mgarcia',
      password: 'iconnect2026',
      name: 'Miguel Garcia',
      role: 'Subscriber',
      department: 'Finance',
      email: 'miguel.garcia@iconnect.local',
      balance: 18720,
    },
  ];

  readonly currentUser = signal<MockUser | null>(this.restoreUser());

  login(username: string, password: string): MockUser | null {
    const user = this.users.find(
      (item) => item.username === username.trim() && item.password === password,
    );

    if (!user) {
      return null;
    }

    this.currentUser.set(user);
    localStorage.setItem(this.storageKey, JSON.stringify(user));
    return user;
  }

  logout(): void {
    this.currentUser.set(null);
    localStorage.removeItem(this.storageKey);
  }

  private restoreUser(): MockUser | null {
    const stored = localStorage.getItem(this.storageKey);
    if (!stored) {
      return null;
    }

    try {
      const user = JSON.parse(stored) as MockUser;
      return this.users.find((item) => item.username === user.username) ?? null;
    } catch {
      localStorage.removeItem(this.storageKey);
      return null;
    }
  }
}
