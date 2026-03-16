import { ComponentFixture, TestBed } from '@angular/core/testing'

import { HorizontalScrollButtons } from './horizontal-scroll-buttons'

describe('HorizontalScrollButtons', () => {
	let component: HorizontalScrollButtons
	let fixture: ComponentFixture<HorizontalScrollButtons>

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [HorizontalScrollButtons]
		})
		.compileComponents()

		fixture = TestBed.createComponent(HorizontalScrollButtons)
		component = fixture.componentInstance
		await fixture.whenStable()
	})

	it('should create', () => {
		expect(component).toBeTruthy()
	})
})
