import { ComponentFixture, TestBed } from '@angular/core/testing'

import { PageHeaderBar } from './page-header-bar'

describe('PageHeaderBar', () => {
  let component: PageHeaderBar
  let fixture: ComponentFixture<PageHeaderBar>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageHeaderBar]
    })
    .compileComponents()

    fixture = TestBed.createComponent(PageHeaderBar)
    component = fixture.componentInstance
    await fixture.whenStable()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
