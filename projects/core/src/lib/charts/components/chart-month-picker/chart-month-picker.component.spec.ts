import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChartMonthPickerComponent } from './chart-month-picker.component';

describe('ChartMonthPickerComponent', () => {
  let component: ChartMonthPickerComponent;
  let fixture: ComponentFixture<ChartMonthPickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChartMonthPickerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChartMonthPickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
