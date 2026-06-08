import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { RouterModule } from "@angular/router";

export interface Breadcrumb {
  label: string;
  url?: string;
}

@Component({
  selector: "lib-breadcrumb",
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule],
  templateUrl: "./breadcrumb.component.html",
  styleUrl: "./breadcrumb.component.scss",
})
export class BreadcrumbComponent {
  @Input() breadcrumbs: { label: string; url?: string }[] = [];
}
