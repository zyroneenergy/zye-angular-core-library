import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SitePerfoSummaryStatsComponent } from './site-perfo-summary-stats.component';

describe('SitePerfoSummaryStatsComponent', () => {
  let component: SitePerfoSummaryStatsComponent;
  let fixture: ComponentFixture<SitePerfoSummaryStatsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SitePerfoSummaryStatsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SitePerfoSummaryStatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
