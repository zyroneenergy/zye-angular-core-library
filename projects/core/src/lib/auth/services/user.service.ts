import { computed, Injectable, signal } from '@angular/core';
import { UserInfo } from '../models/user-info';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private userInfo = signal<UserInfo | null>(null);
  private token = signal<string | null>(null);
  
  // Computed signals for easy access
  public userId = computed(() => this.userInfo()?.userId || null);
  public username = computed(() => this.userInfo()?.username || null);
  public isAuthenticated = computed(() => !!this.token());
  public userData = computed(() => this.userInfo());
  public tenantId = computed(() => this.userInfo()?.tenantId);
  
  constructor() { 
    this.initializeFromStorage();
  }

  // Initialize from localStorage or sessionStorage on service creation
  private initializeFromStorage(): void {
    // check both storages so decoded user info is available no matter where tokens were stored
    const storedToken = localStorage.getItem('access_token') ?? sessionStorage.getItem('access_token');
    if (storedToken) {
      this.setToken(storedToken);
    }
  }

  // Set token and decode user info
  setToken(token: string): void {
    try {
      const decoded: any = jwtDecode(token);
      
      const userInfo: UserInfo = {
        userId: decoded.userId || decoded.sub,
        username: decoded.username || decoded.name,
        tenantId: decoded.tenantId,
        tenantCode: decoded.tenantCode,
        roles: decoded.roles || []
      };

      this.token.set(token);
      this.userInfo.set(userInfo);
    } catch (error) {
      console.error('Invalid token:', error);
      this.clearUserData();
    }
  }

  // Clear user data (logout)
  clearUserData(): void {
    this.token.set(null);
    this.userInfo.set(null);
    // ensure removal from both storages (remember/session)
    localStorage.removeItem('access_token');
    sessionStorage.removeItem('access_token');
  }

  // Get raw token (for API calls)
  getToken(): string | null {
    return this.token();
  }

  // Check if user has specific role
  hasRole(role: string): boolean {
    return this.userInfo()?.roles?.includes(role) ?? false;
  }
}

