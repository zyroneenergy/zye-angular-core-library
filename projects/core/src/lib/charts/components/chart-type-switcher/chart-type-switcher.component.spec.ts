import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChartTypeSwitcherComponent } from './chart-type-switcher.component';

describe('ChartTypeSwitcherComponent', () => {
  let component: ChartTypeSwitcherComponent;
  let fixture: ComponentFixture<ChartTypeSwitcherComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChartTypeSwitcherComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChartTypeSwitcherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
