import { ComponentFixture, TestBed } from '@angular/core/testing'

import { DynamicScrollable } from './dynamic-scrollable'

describe('DynamicScrollable', () => {
	let component: DynamicScrollable
	let fixture: ComponentFixture<DynamicScrollable>

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [DynamicScrollable]
		})
		.compileComponents()

		fixture = TestBed.createComponent(DynamicScrollable)
		component = fixture.componentInstance
		await fixture.whenStable()
	})

	it('should create', () => {
		expect(component).toBeTruthy()
	})
})
