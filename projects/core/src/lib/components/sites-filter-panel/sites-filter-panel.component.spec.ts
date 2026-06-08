import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SitesFilterPanelComponent } from './sites-filter-panel.component';

describe('SitesFilterPanelComponent', () => {
  let component: SitesFilterPanelComponent;
  let fixture: ComponentFixture<SitesFilterPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SitesFilterPanelComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SitesFilterPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
