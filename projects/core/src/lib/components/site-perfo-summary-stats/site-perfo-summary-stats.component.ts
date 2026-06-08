import { Component, Input } from "@angular/core";
import { MatCard, MatCardContent } from "@angular/material/card";
import { CommonModule } from "@angular/common";
import { MatIconModule } from "@angular/material/icon";
import { ShimmerComponent } from "../shimmer/shimmer.component";
import { EmptyDataComponent } from "../empty-data/empty-data.component";
import {  KpiStat, StatCardStatus, StatCardVariant } from "../../models/components/perfo-summary-stats.model";

@Component({
  selector: "lib-site-perfo-summary-stats",
  standalone: true,
  imports: [
    MatCard,
    MatCardContent,
    CommonModule,
    MatIconModule,
    ShimmerComponent,
    EmptyDataComponent,
  ],
  templateUrl: "./site-perfo-summary-stats.component.html",
  styleUrls: ["./site-perfo-summary-stats.component.scss"],
})
export class SitePerfoSummaryStatsComponent {

  @Input({ required: false }) title?: string;
  @Input({ required: false }) description?: string;
  @Input({ required: false }) icon?: string;

  @Input({ required: true }) stats!: KpiStat[];
  @Input() variant: StatCardVariant = 'normal';
  @Input() shimmerCount: number = 4;

  @Input({ required: true }) status!: StatCardStatus;

  get cardClass(): string {
    return `kpi-card kpi-card--${this.variant}`;
  }
}