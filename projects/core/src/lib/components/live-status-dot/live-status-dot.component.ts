import { CommonModule } from '@angular/common';
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'lib-live-status-dot',
  standalone: true,
  imports: [CommonModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './live-status-dot.component.html',
  styleUrl: './live-status-dot.component.scss'
})
export class LiveStatusDotComponent {
  @Input() isLive = true;
  @Input() tooltipText?: string;
}
