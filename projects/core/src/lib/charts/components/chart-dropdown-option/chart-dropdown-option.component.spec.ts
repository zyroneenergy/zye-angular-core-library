import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChartDropdownOptionComponent } from './chart-dropdown-option.component';

describe('ChartDropdownOptionComponent', () => {
  let component: ChartDropdownOptionComponent;
  let fixture: ComponentFixture<ChartDropdownOptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChartDropdownOptionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChartDropdownOptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
