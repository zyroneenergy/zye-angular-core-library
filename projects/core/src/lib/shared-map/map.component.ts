/**
 * Generic, domain-free Mapbox wrapper.
 * - Dynamic import of mapbox-gl (no initial bundle cost)
 * - ResizeObserver for container-driven resize
 * - Theme switching (light/dark style URLs)
 * - onMapReady / onStyleLoaded hooks for parent composition
 * - Full ngOnDestroy cleanup (no memory leaks)
 */
import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  Optional,
  ViewChild,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { EventNames, EventsService } from '../services/frontend/events.service';
import { ThemeService } from '../services/frontend/theme.service';
import { CORE_CONFIG } from '../config/core-config.token';
import { CoreConfig } from '../../public-api';


// mapboxgl is loaded lazily — we only type-reference it here
type MapboxMap = import('mapbox-gl').Map;

@Component({
  selector: 'lib-map',
  standalone: true,
  imports: [],
  template: `<div #mapContainer class="map-container"></div>`,
  styles: [`
    :host { display: block; width: 100%; height: 100%; }
    .map-container { width: 100%; height: 100%; }
  `],
})
export class MapComponent implements OnInit, AfterViewInit, OnDestroy {

  @Input() initialZoom  = 4;
  @Input() initialCenter: [number, number] = [78.9629, 22.5937]; // India centroid

  @ViewChild('mapContainer', { static: true })
  mapContainer!: ElementRef<HTMLDivElement>;

  // ── Public hooks — set by parent before ngAfterViewInit ──────────────────
  onMapReady?:    (map: MapboxMap) => void;
  onStyleLoaded?: (map: MapboxMap) => void;

  // ── Internal state ────────────────────────────────────────────────────────
  private map?: MapboxMap;
  private style = '';
  private isDark     = false;
  private initRetries = 0;
  private readonly MAX_RETRIES = 5;

  private themeSubscription?: Subscription;
  private resizeObserver?: ResizeObserver;
  private boundResize = () => this.resizeMap();

  constructor(
  private themeService: ThemeService,

  @Inject(CORE_CONFIG)
  private config: CoreConfig
) {}

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {

  this.style = this.config.styleUrl.light;

  this.themeSubscription = this.themeService.theme$
    .subscribe((theme: string) => {

      this.isDark = theme === 'dark';

      this.style = this.isDark
        ? this.config.styleUrl.dark
        : this.config.styleUrl.light;

      if (this.map) {
        this.toggleTheme(theme);
      }
    });
}

  ngAfterViewInit(): void {
    this.loadAndInitMap();
    window.addEventListener('resize', this.boundResize);
  }

  ngOnDestroy(): void {
    this.themeSubscription?.unsubscribe();
    this.resizeObserver?.disconnect();
    window.removeEventListener('resize', this.boundResize);
    if (this.map) {
      this.map.remove();
      this.map = undefined;
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────

  public resizeMap(): void {
    this.map?.resize();
  }

  // ── Dynamic import + init ─────────────────────────────────────────────────

  private async loadAndInitMap(): Promise<void> {
    try {
      // Dynamic import — mapbox-gl is NOT in the initial chunk
      const mapboxglModule = await import('mapbox-gl');
      const mapboxgl = mapboxglModule.default;
      this.initializeMap(mapboxgl);
    } catch (err) {
      console.error('[MapComponent] Failed to load mapbox-gl:', err);
    }
  }

  private initializeMap(mapboxgl: typeof import('mapbox-gl')['default']): void {
    // Guard: container must be visible
    const container = this.mapContainer.nativeElement;
    if (container.offsetWidth === 0 || container.offsetHeight === 0) {
      if (this.initRetries < this.MAX_RETRIES) {
        this.initRetries++;
        setTimeout(() => this.initializeMap(mapboxgl), 150);
        return;
      }
      console.warn('[MapComponent] Container never became visible — aborting init.');
      return;
    }
    this.initRetries = 0;

    // Clean previous instance (e.g. during hot-reload)
    if (this.map) { this.map.remove(); this.map = undefined; }

    (mapboxgl as any).accessToken = this.config.mapbox.accessToken;

    const map = new mapboxgl.Map({
      container,
      style:            this.style,
      center:           this.initialCenter,
      zoom:             window.innerWidth < 768 ? 2.5 : this.initialZoom,
      minZoom:          1,
      maxZoom:          14,
      scrollZoom:       true,
      doubleClickZoom:  false,
      dragRotate:       false,
      attributionControl: false,
      maxBounds:        [[-180, -80], [180, 80]],
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

    map.on('load', () => {
      map.resize();
      this.onMapReady?.(map);
    });

    this.map = map;
    this.setupResizeObserver(container);
  }

  // ── Theme ─────────────────────────────────────────────────────────────────

  private toggleTheme(theme: string): void {
    this.style = theme === 'dark' ? this.config.styleUrl.dark : this.config.styleUrl.light;
    if (!this.map) return;
    this.map.setStyle(this.style);
    this.map.once('style.load', () => {
      this.onStyleLoaded?.(this.map!);
    });
  }

  // ── ResizeObserver ────────────────────────────────────────────────────────

  private setupResizeObserver(container: HTMLElement): void {
    if (typeof ResizeObserver === 'undefined') {
      setTimeout(() => this.resizeMap(), 200);
      return;
    }
    this.resizeObserver?.disconnect();
    this.resizeObserver = new ResizeObserver(() => this.resizeMap());
    this.resizeObserver.observe(container);
  }
}