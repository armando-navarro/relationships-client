import { ComponentFixture, TestBed } from '@angular/core/testing'

import { HorizontalScrollButtonsComponent } from './horizontal-scroll-buttons.component'

describe('HorizontalScrollButtonsComponent', () => {
	let component: HorizontalScrollButtonsComponent
	let fixture: ComponentFixture<HorizontalScrollButtonsComponent>

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [HorizontalScrollButtonsComponent]
		})
		.compileComponents()

		fixture = TestBed.createComponent(HorizontalScrollButtonsComponent)
		component = fixture.componentInstance
		fixture.detectChanges()
	})

	it('should create', () => {
		expect(component).toBeTruthy()
	})
})
