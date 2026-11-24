import { computed, Injectable, signal } from '@angular/core';
import { UserInfo } from '../models/user-info';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private userInfo = signal<UserInfo | null>(null);

  public userId = computed(() => this.userInfo()?.userId ?? null);
  public username = computed(() => this.userInfo()?.username ?? null);
  public firstName = computed(() => this.userInfo()?.firstName ?? null);
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
    const wanted = role.trim().toLowerCase();
    const roles = this.userInfo()?.roles ?? [];
    return (Array.isArray(roles) ? roles : [roles]).some(r => r.trim().toLowerCase() === wanted);
  }
}

