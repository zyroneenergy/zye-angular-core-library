import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChartCalendarComponent } from './chart-calendar.component';

describe('ChartCalendarComponent', () => {
  let component: ChartCalendarComponent;
  let fixture: ComponentFixture<ChartCalendarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChartCalendarComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChartCalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
