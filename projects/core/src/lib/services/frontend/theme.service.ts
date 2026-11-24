import { Injectable, signal } from "@angular/core";
import { BehaviorSubject } from "rxjs";

export type ThemeMode = "light" | "dark";

const STORAGE_KEY = "themeMode";

@Injectable({
  providedIn: "root",
})
export class ThemeService {
  private _theme$ = new BehaviorSubject<ThemeMode>(this.getSystemTheme());
  theme$ = this._theme$.asObservable();

  /** Current theme as a signal. */
  readonly theme = signal<ThemeMode>(this._theme$.value);

  /**
   * Applies the saved theme (or the OS preference) to <body>. Call once at
   * startup; until the user picks a theme, OS changes are followed live.
   */
  init(): void {
    this.apply(this.getSystemTheme(), false);
    try {
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
        if (!this.hasStoredTheme()) this.apply(e.matches ? "dark" : "light", false);
      });
    } catch {
      /* matchMedia unavailable */
    }
  }

  /** Switches theme and remembers the choice. */
  toggleTheme(isDark: boolean) {
    this.apply(isDark ? "dark" : "light", true);
  }

  getSystemTheme(): ThemeMode {
    const stored = this.readStored();
    if (stored) return stored;
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  static getCssVariable(colorName: string): string {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(colorName)
      .trim();
  }

  private apply(theme: ThemeMode, persist: boolean): void {
    const isDark = theme === "dark";
    document.body.classList.toggle("dark-theme", isDark);
    document.body.classList.toggle("light-theme", !isDark);
    document.body.setAttribute("data-zy-theme", theme);
    // Native controls, scrollbars and autofill follow the theme too.
    document.documentElement.style.colorScheme = theme;
    if (persist) {
      try {
        localStorage.setItem(STORAGE_KEY, theme);
      } catch {
        /* not persisted */
      }
    }
    this.theme.set(theme);
    this._theme$.next(theme);
  }

  private hasStoredTheme(): boolean {
    return this.readStored() !== null;
  }

  private readStored(): ThemeMode | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === "dark" || stored === "light" ? stored : null;
    } catch {
      return null;
    }
  }
}
