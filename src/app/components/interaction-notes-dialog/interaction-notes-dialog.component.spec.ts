import { ComponentFixture, TestBed } from '@angular/core/testing'

import { InteractionNotesDialogComponent } from './interaction-notes-dialog.component'

describe('InteractionNotesDialogComponent', () => {
	let component: InteractionNotesDialogComponent
	let fixture: ComponentFixture<InteractionNotesDialogComponent>

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [InteractionNotesDialogComponent]
		})
		.compileComponents()

		fixture = TestBed.createComponent(InteractionNotesDialogComponent)
		component = fixture.componentInstance
		fixture.detectChanges()
	})

	it('should create', () => {
		expect(component).toBeTruthy()
	})
})
