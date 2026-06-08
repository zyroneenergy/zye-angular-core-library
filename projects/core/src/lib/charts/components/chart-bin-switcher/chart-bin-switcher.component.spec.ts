import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChartBinSwitcherComponent } from './chart-bin-switcher.component';

describe('ChartBinSwitcherComponent', () => {
  let component: ChartBinSwitcherComponent;
  let fixture: ComponentFixture<ChartBinSwitcherComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChartBinSwitcherComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChartBinSwitcherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
