import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LiveStatusDotComponent } from './live-status-dot.component';

describe('LiveStatusDotComponent', () => {
  let component: LiveStatusDotComponent;
  let fixture: ComponentFixture<LiveStatusDotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LiveStatusDotComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LiveStatusDotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
