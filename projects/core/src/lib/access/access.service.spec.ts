import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { CORE_CONFIG } from '../config/core-config.token';
import { UserService } from '../auth/services/user.service';
import { AccessService } from './access.service';
import { AccessPolicy, provideAccessControl } from './access.config';
import { RoleCode } from './role-codes';
import { accessGuard, homeRedirectGuard } from './access.guard';
import { filterNavItems } from '../navigation/sidenav/sidenav.component';
import { NavItem } from '../navigation/nav-item.model';

const POLICY: AccessPolicy = {
  features: {
    dashboard: { exceptRoles: [RoleCode.TenantClient] },
    'sites.list': {},
    'sites.details': { exceptRoles: [RoleCode.TenantClient] },
    users: { adminOnly: true },
    reports: { module: 'REPORT', level: 'admin' },
  },
  homeByRole: { [RoleCode.TenantClient]: '/sites' },
  defaultHome: '/dashboard',
};

describe('AccessService', () => {
  let access: AccessService;
  let user: UserService;

  const signIn = (roles: string[], moduleAccess: Record<string, string> = {}) =>
    user.setUser({ userId: 'u1', username: 'a@b.c', tenantId: 't1', tenantCode: 'T', roles, moduleAccess });

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: CORE_CONFIG, useValue: { apiUrl: '', auth: {} } },
        provideAccessControl(POLICY),
      ],
    });
    access = TestBed.inject(AccessService);
    user = TestBed.inject(UserService);
  });

  it('denies everything when signed out', () => {
    expect(access.can('sites.list')).toBeFalse();
  });

  it('tenant client: sites table only, lands on /sites', () => {
    signIn(['TENANT_CLIENT']); // case-insensitive, like the API
    expect(access.can('sites.list')).toBeTrue();
    expect(access.can('sites.details')).toBeFalse();
    expect(access.can('dashboard')).toBeFalse();
    expect(access.can('users')).toBeFalse();
    expect(access.homeUrl()).toBe('/sites');
  });

  it('admin sees everything and lands on the default home', () => {
    signIn(['admin']);
    expect(access.can(['dashboard', 'sites.details', 'users', 'reports'])).toBeTrue();
    expect(access.homeUrl()).toBe('/dashboard');
  });

  it('module access grants by level', () => {
    signIn(['site_analyst'], { report: 'read' });
    expect(access.can('reports')).toBeFalse();
    signIn(['site_analyst'], { REPORT: 'admin' });
    expect(access.can('reports')).toBeTrue();
  });

  it('unknown features are denied', () => {
    signIn(['admin']);
    spyOn(console, 'warn');
    expect(access.can('nope')).toBeFalse();
  });

  it('resolves role ids through the catalog', () => {
    user.setUser({ userId: 'u', username: '', tenantId: 't', tenantCode: '', roles: [], roleIds: ['r9'] });
    expect(access.isAdmin()).toBeFalse();
    access.setRoleCatalog([{ id: 'r9', code: 'admin' }]);
    expect(access.isAdmin()).toBeTrue();
  });

  it('guard redirects a denied route to the role home', () => {
    signIn(['tenant_client']);
    const router = TestBed.inject(Router);
    const result = TestBed.runInInjectionContext(() => accessGuard({ data: { access: 'sites.details' } }));
    expect(router.serializeUrl(result as never)).toBe('/sites');
    expect(TestBed.runInInjectionContext(() => accessGuard({ data: { access: 'sites.list' } }))).toBeTrue();
    expect(router.serializeUrl(TestBed.runInInjectionContext(() => homeRedirectGuard()))).toBe('/sites');
  });

  it('menu hides what the role cannot open, and empty groups', () => {
    signIn(['tenant_client']);
    const menu: NavItem[] = [
      { name: 'Dashboard', icon: '', path: '/dashboard', access: 'dashboard' },
      { name: 'Sites', icon: '', path: '/sites', access: 'sites.list' },
      { name: 'Admin', icon: '', children: [{ name: 'Users', icon: '', path: '/users', access: 'users' }] },
    ];
    expect(filterNavItems(menu, (i) => access.can(i.access)).map((i) => i.name)).toEqual(['Sites']);
  });
});
