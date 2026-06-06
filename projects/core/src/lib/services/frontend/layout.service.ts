import { Injectable, signal, inject, NgZone, OnDestroy, computed } from "@angular/core";

@Injectable({ providedIn: "root" })
export class LayoutService implements OnDestroy {
  private mobileWidth = 768;
  private tabletWidth = 1024;

  private zone = inject(NgZone);

  deviceType = signal<"mobile" | "tablet" | "desktop">(this.getDeviceType());

  private resizeHandler = () => this.updateDeviceType();

  isMobile = computed(() => this.deviceType() === 'mobile');
  isTablet = computed(() => this.deviceType() === 'tablet');
  isDesktop = computed(() => this.deviceType() === 'desktop');

  constructor() {
    this.zone.runOutsideAngular(() => {
      window.addEventListener("resize", this.resizeHandler);
    });
  }

  ngOnDestroy() {
    window.removeEventListener("resize", this.resizeHandler);
  }

  private getDeviceType(): "mobile" | "tablet" | "desktop" {
    const width = window.innerWidth;
    if (width < this.mobileWidth) return "mobile";
    if (width < this.tabletWidth) return "tablet";
    return "desktop";
  }

  private updateDeviceType() {
    const type = this.getDeviceType();
    this.zone.run(() => this.deviceType.set(type));
  }
}