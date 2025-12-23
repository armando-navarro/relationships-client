import { ComponentFixture, TestBed } from '@angular/core/testing'

import { DynamicScrollableComponent } from './dynamic-scrollable.component'

describe('DynamicScrollableComponent', () => {
	let component: DynamicScrollableComponent
	let fixture: ComponentFixture<DynamicScrollableComponent>

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [DynamicScrollableComponent]
		})
		.compileComponents()

		fixture = TestBed.createComponent(DynamicScrollableComponent)
		component = fixture.componentInstance
		fixture.detectChanges()
	})

	it('should create', () => {
		expect(component).toBeTruthy()
	})
})
