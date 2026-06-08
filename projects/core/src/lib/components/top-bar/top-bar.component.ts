import { Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

@Component({
  selector: 'lib-top-bar',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './top-bar.component.html',
  styleUrl: './top-bar.component.scss'
})
export class TopBarComponent {

  @Input() title: string = 'My Portfolio';
  @Input() subtitle: string = 'A high level overview of your portfolio';

  constructor(private router: Router) { }

  navigateToOnboarding() {
    this.router.navigateByUrl("/sites/onboard");
  }
  
}
