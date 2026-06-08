import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChartYearPickerComponent } from './chart-year-picker.component';

describe('ChartYearPickerComponent', () => {
  let component: ChartYearPickerComponent;
  let fixture: ComponentFixture<ChartYearPickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChartYearPickerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChartYearPickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
