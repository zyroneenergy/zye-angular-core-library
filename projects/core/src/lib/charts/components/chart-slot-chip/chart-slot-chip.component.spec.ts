import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChartSlotChipComponent } from './chart-slot-chip.component';

describe('ChartSlotChipComponent', () => {
  let component: ChartSlotChipComponent;
  let fixture: ComponentFixture<ChartSlotChipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChartSlotChipComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChartSlotChipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
