import { ComponentFixture, TestBed } from '@angular/core/testing'

import { InteractionDialog } from './interaction-dialog'

describe('InteractionDialog', () => {
	let component: InteractionDialog
	let fixture: ComponentFixture<InteractionDialog>

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [InteractionDialog]
		})
		.compileComponents()

		fixture = TestBed.createComponent(InteractionDialog)
		component = fixture.componentInstance
		fixture.detectChanges()
	})

	it('should create', () => {
		expect(component).toBeTruthy()
	})
})
