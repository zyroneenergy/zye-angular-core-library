// Wrapper card that provides the standard header layout used by all chart cards:
//
//   Desktop (1 row):
//     [Title + Subtitle]  ←→  [<ng-content select="[controls]">]  [type switcher]
//
//   Tablet / Mobile (2 rows):
//     Row 1:  [Title + Subtitle]  ←→  [type switcher]
//     Row 2:  <ng-content select="[mobile-controls]">
//
// Usage:
//   <app-chart-card [title]="t" [subtitle]="s">
//
//     <!-- Desktop right controls -->
//     <ng-container controls>
//       <app-chart-bin-switcher .../>
//       <app-chart-dropdown .../>
//     </ng-container>
//
//     <!-- Mobile second-row controls -->
//     <ng-container mobile-controls>
//       <app-chart-bin-switcher .../>
//       <app-chart-dropdown .../>
//     </ng-container>
//
//     <!-- Chart type switcher (shown always, right of header) -->
//     <app-chart-type-switcher type-switcher .../>
//
//     <!-- Content: range bar, slot area, chart, etc. -->
//     <ng-container content>
//       ...
//     </ng-container>
//   </app-chart-card>
//
// The card never knows about any specific KPI, bin, or data model.
// ─────────────────────────────────────────────────────────────────────────────
 
import {
  ChangeDetectionStrategy, Component, Input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { LayoutService } from '../../../services/frontend/layout.service';
 
@Component({
  selector:        'lib-chart-card',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule, MatCardModule],
  templateUrl: './chart-card.component.html',
  styleUrl: './chart-card.component.scss'
})
export class ChartCardComponent {
  @Input() title    = '';
  @Input() subtitle = '';

  constructor(public layout: LayoutService) {}
 
  // No-op reference so host can bind (click)="closeAll.call(this)"
  // The actual close logic lives in the concrete chart component.
  closeAll: () => void = () => {};
}
