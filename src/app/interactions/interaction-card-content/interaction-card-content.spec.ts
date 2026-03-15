import { ComponentFixture, TestBed } from '@angular/core/testing'

import { InteractionCardContent } from './interaction-card-content'

describe('InteractionCardContent', () => {
	let component: InteractionCardContent
	let fixture: ComponentFixture<InteractionCardContent>

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [InteractionCardContent]
		})
		.compileComponents()

		fixture = TestBed.createComponent(InteractionCardContent)
		component = fixture.componentInstance
		fixture.detectChanges()
	})

	it('should create', () => {
		expect(component).toBeTruthy()
	})
})
