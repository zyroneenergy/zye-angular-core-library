import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, ReplaySubject, Subject, filter, map } from "rxjs";
export enum EventNames {
  toggletheme = "ToggleTheme",
  timeselection = "timeSubmit",
  toogleSwitchButton = "toogleSwitchButton"
}
@Injectable({
  providedIn: "root",
})
export class EventsService {

private subject = new ReplaySubject<{ eventName: string; data: any }>(2000); // ✅ changed from Subject to ReplaySubject(1)

  emitEvent(eventName: string, data?: any): void {
    this.subject.next({ eventName, data });
  }

  on(eventName: string): Observable<any> {
    return this.subject.asObservable().pipe(
      filter((event) => event.eventName === eventName),
      map((event) => event.data)
    );
  }

  private dataSource = new BehaviorSubject<any>({});
  currentData = this.dataSource.asObservable();
  changeData(eventName: string, data: string[]) {
    this.dataSource.next({ eventName, data });
  }

  getData(eventName: string) {
    return this.dataSource.asObservable().pipe(
      filter((event) => event.eventName === eventName),
      map((event) => event.data),
    );
  }

  private timeSource = new BehaviorSubject<any>({});
  changeTime(eventName: string, data: string[]) {
    this.timeSource.next({ eventName, data });
  }

  getTime(eventName: string) {
    return this.timeSource.asObservable().pipe(
      filter((event) => event.eventName === eventName),
      map((event) => event.data),
    );
  }
}
