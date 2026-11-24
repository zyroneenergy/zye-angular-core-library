import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  booleanAttribute,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

let nextId = 0;

/**
 * Right-hand slide-over panel (details, filters, quick views).
 * Desktop: a sheet from the right edge. Phone: full-screen sheet.
 * Esc, backdrop click and the close button all emit `closed`; focus moves in
 * on open and back to the opener on close.
 *
 *   <lib-side-panel [opened]="open()" title="Site details" (closed)="open.set(false)">
 *     …body…
 *     <div panelFooter>…actions…</div>
 *   </lib-side-panel>
 */
@Component({
  selector: 'lib-side-panel',
  standalone: true,
  templateUrl: './side-panel.component.html',
  styleUrl: './side-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.is-open]': 'opened()',
    '[style.--sp-width]': 'width()',
  },
})
export class SidePanelComponent {
  readonly opened = input(false, { transform: booleanAttribute });
  readonly title = input('');
  readonly subtitle = input('');
  /** Panel width on desktop (any CSS length). */
  readonly width = input('450px');
  readonly closeOnBackdrop = input(true, { transform: booleanAttribute });
  readonly closed = output<void>();

  protected readonly titleId = `lib-side-panel-title-${nextId++}`;
  /** Kept true until the close animation ends, so content doesn't vanish mid-slide. */
  protected readonly rendered = signal(false);

  private readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');
  private returnFocus: HTMLElement | null = null;

  constructor() {
    effect(() => {
      if (this.opened()) {
        this.returnFocus = document.activeElement as HTMLElement | null;
        this.rendered.set(true);
        queueMicrotask(() => this.panel().nativeElement.focus({ preventScroll: true }));
      } else if (this.returnFocus) {
        this.returnFocus.focus?.({ preventScroll: true });
        this.returnFocus = null;
      }
    }, { allowSignalWrites: true });
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.opened()) this.closed.emit();
  }

  protected onBackdrop(): void {
    if (this.closeOnBackdrop()) this.closed.emit();
  }

  protected onTransitionEnd(event: TransitionEvent): void {
    if (event.target === this.panel().nativeElement && !this.opened()) this.rendered.set(false);
  }
}
