import { computed, Injectable, signal } from '@angular/core';
import { UserInfo } from '../models/user-info';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private userInfo = signal<UserInfo | null>(null);

  public userId = computed(() => this.userInfo()?.userId ?? null);
  public username = computed(() => this.userInfo()?.username ?? null);
  public isAuthenticated = computed(() => !!this.userInfo());
  public userData = computed(() => this.userInfo());
  public tenantId = computed(() => this.userInfo()?.tenantId ?? null);

  constructor() {}

  setUser(user: UserInfo): void {
    this.userInfo.set(user);
  }

  clearUserData(): void {
    this.userInfo.set(null);
  }

  hasRole(role: string): boolean {
    const roles = this.userInfo()?.roles;
    if (Array.isArray(roles)) {
      return roles.includes(role);
    }

    return roles === role;
  }
}

