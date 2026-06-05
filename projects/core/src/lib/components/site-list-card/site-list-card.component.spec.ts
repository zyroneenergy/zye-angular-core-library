import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteListCardComponent } from './site-list-card.component';

describe('SiteListCardComponent', () => {
  let component: SiteListCardComponent;
  let fixture: ComponentFixture<SiteListCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteListCardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SiteListCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
