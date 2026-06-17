import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SessionService {

  private sessionExpired = new Subject<void>();

  sessionExpired$ = this.sessionExpired.asObservable();

  markExpired(): void {
    this.sessionExpired.next();
  }
}