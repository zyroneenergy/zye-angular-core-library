import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { ShimmerComponent } from '../shimmer/shimmer.component';

export interface StatisticItem {
  title: string;
  value: string | number;
  unit?: string;
  icon?: string;
  growth?: string;
  trend?: 'up' | 'down';
}

@Component({
  selector: 'lib-statistics-cards',
  standalone: true,
  imports: [CommonModule, MatDividerModule, MatIconModule, ShimmerComponent],
  templateUrl: './statistics-cards.component.html',
  styleUrl: './statistics-cards.component.scss'
})
export class StatisticsCardsComponent {
  @Input({ required: true }) items: StatisticItem[] = [];
  @Input() isLoading = false;
  @Input() shimmerCount = 2;
  @Input() showDividers = true;
  @Input() dense = false;
  @Input() verticalOnMobile = true;
}
