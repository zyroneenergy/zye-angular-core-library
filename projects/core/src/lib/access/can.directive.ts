import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';
import { AccessRequirement } from './access.config';
import { AccessService } from './access.service';

/**
 * Renders its content only when the user meets the requirement.
 *
 *   <button *libCan="'sites.details'">Open</button>
 *   <div *libCan="{ adminOnly: true }; else readOnly">…</div>
 */
@Directive({
  selector: '[libCan]',
  standalone: true,
})
export class CanDirective {
  readonly libCan = input.required<AccessRequirement>();
  readonly libCanElse = input<TemplateRef<unknown> | null>(null);

  private readonly access = inject(AccessService);
  private readonly template = inject(TemplateRef<unknown>);
  private readonly container = inject(ViewContainerRef);

  constructor() {
    effect(() => {
      const allowed = this.access.can(this.libCan());
      const fallback = this.libCanElse();
      this.container.clear();
      if (allowed) this.container.createEmbeddedView(this.template);
      else if (fallback) this.container.createEmbeddedView(fallback);
    });
  }
}
