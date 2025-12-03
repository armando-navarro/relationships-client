import { ComponentFixture, TestBed } from '@angular/core/testing'

import { InteractionCardContentComponent } from './interaction-card-content.component'

describe('InteractionCardContentComponent', () => {
	let component: InteractionCardContentComponent
	let fixture: ComponentFixture<InteractionCardContentComponent>

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [InteractionCardContentComponent]
		})
		.compileComponents()

		fixture = TestBed.createComponent(InteractionCardContentComponent)
		component = fixture.componentInstance
		fixture.detectChanges()
	})

	it('should create', () => {
		expect(component).toBeTruthy()
	})
})
