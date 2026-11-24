# Core

This library was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.3.0.

## Code scaffolding

Run `ng generate component component-name --project core` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module --project core`.
> Note: Don't forget to add `--project core` or else it will be added to the default project in your `angular.json` file. 

## Build

Run `ng build core` to build the project. The build artifacts will be stored in the `dist/` directory.

## Publishing

After building your library with `ng build core`, go to the dist folder `cd dist/core` and run `npm publish`.

## Running unit tests

Run `ng test core` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.

## App shell, sidebar and role-based access (v0.0.22)

### Global styles
In the app's `angular.json`, put the library styles folder on the Sass include path and copy its assets:

```json
"stylePreprocessorOptions": { "includePaths": ["node_modules/@zyroneenergy/zye-angular-core-library/src/styles"] },
"assets": [{ "glob": "**/*", "input": "node_modules/@zyroneenergy/zye-angular-core-library/src/assets", "output": "assets" }]
```

`src/styles.scss` is then a single line. It covers light and dark themes, Material overrides, form fields, dialogs (`.dlg`), dropdown panels (`.app-panel`), the switch (`.app-switch`) and `.page-actions`:

```scss
@use "core";
```

Call `inject(ThemeService).init()` once in the root component. It applies the saved theme, or follows the OS until the user picks one.

### Access policy (one file per app)
```ts
export const ACCESS_POLICY: AccessPolicy = {
  features: {
    'sites.list':    {},                                        // any signed-in user
    'sites.details': { exceptRoles: [RoleCode.TenantClient] },  // everyone except tenant clients
    users:           { adminOnly: true },
    reports:         { module: 'REPORT', level: 'admin' },      // from the token's moduleAccessMap
  },
  homeByRole: { [RoleCode.TenantClient]: '/sites' },            // landing page per role
  defaultHome: '/dashboard',
};
// app.config.ts
provideAccessControl(ACCESS_POLICY)
```

Admins and super admins pass every rule unless `exceptRoles` names them, as the API's GbacGuard does.
Roles are read from the access token's `role` claim. The API still enforces access; this only shapes the UI.

### Routes
```ts
{ path: '', component: ShellLayout, canActivate: [AuthGuard], canActivateChild: [accessGuard], children: [
  { path: '', pathMatch: 'full', canActivate: [homeRedirectGuard], children: [] },  // → role home
  { path: 'sites/:id', data: { access: 'sites.details' }, loadComponent: … },        // denied → role home
]}
```

### Sidebar (ChatGPT / Claude style, customer-console layout)
Compose it in `app.component.html`, as the customer console does:
```html
<div class="app-shell">
  <lib-sidenav brandName="Solar APM" [menuItems]="menuItems" [footerItems]="footerItems" [accountItems]="accountItems" />
  <main class="app-main">
    @if (nav.isMobile()) { <lib-mobile-top-bar /> }
    <router-outlet />
  </main>
</div>
```
Or use `<lib-app-shell [menuItems]="menu"><router-outlet /></lib-app-shell>`, which wraps the same layout.

`NavItem` takes `{ name, icon, path, access?, children?, submenu?, badge?, exact? }`. Items the user can't access are hidden.
The footer holds the theme toggle, then `footerItems`, then **My Account**. My Account shows the token's first name when it has one, and never the username or email. It opens a menu with `accountItems` and Log out.
Desktop has a collapsible rail (Ctrl/⌘+B, remembered). Mobile gets a drawer.

### In templates and code
```html
<button *libCan="'sites.details'; else readOnly">Open</button>
```
```ts
inject(AccessService).can('users'); // also hasRole(), hasModule(), isAdmin(), homeUrl(), setRoleCatalog()
```

### Mobile navigation
On phones the sidebar is a rounded drawer with a blurred backdrop. Swipe right from the left screen edge to open it, swipe left (on the drawer or backdrop) to close it, or tap the X. The drawer follows the finger and snaps by distance or fling speed. `<lib-mobile-top-bar>` is the matching header: menu button on the left, centred page title (from the route's `data.title`), and an `[actions]` slot on the right.

### Side panel (slide-over)
```html
<lib-side-panel [opened]="open()" title="Site details" subtitle="Detailed Site Information" (closed)="open.set(false)">
  …body…
  <div panelFooter>…actions…</div>
</lib-side-panel>
```
It slides in from the right on desktop (`width` input, default 450px) and is full-screen on phones. Esc, a backdrop click and the X all emit `closed`. Focus moves into the panel on open and back to the opener on close. Body content is only rendered while the panel is open.
