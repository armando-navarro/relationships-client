import { ComponentFixture, TestBed } from '@angular/core/testing'

import { InteractionDialogComponent } from './interaction-dialog.component'

describe('InteractionDialogComponent', () => {
	let component: InteractionDialogComponent
	let fixture: ComponentFixture<InteractionDialogComponent>

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [InteractionDialogComponent]
		})
		.compileComponents()

		fixture = TestBed.createComponent(InteractionDialogComponent)
		component = fixture.componentInstance
		fixture.detectChanges()
	})

	it('should create', () => {
		expect(component).toBeTruthy()
	})
})
