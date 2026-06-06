import { Injectable, signal } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class ThemeService {

  private _theme$ = new BehaviorSubject< "dark" |  "light">(this.getSystemTheme());
  theme$ = this._theme$.asObservable();

  toggleTheme(isDark: boolean) {
    const theme = isDark ? 'dark' : 'light';
    document.body.classList.toggle("dark-theme", isDark);
    document.body.classList.toggle("light-theme", !isDark);
    document.body.setAttribute("data-zy-theme", isDark ? "dark" : "light");
    localStorage.setItem("themeMode",  isDark ? "dark" : "light");
    this._theme$.next(theme);
  }

  getSystemTheme(): 'light' | 'dark' {
    const stored = localStorage.getItem('themeMode');
    if (stored === 'dark' || stored === 'light') return stored;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }

  static getCssVariable(colorName: string): string {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(colorName)
      .trim();
  }
}
