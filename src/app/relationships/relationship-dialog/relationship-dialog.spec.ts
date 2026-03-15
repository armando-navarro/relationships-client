import { ComponentFixture, TestBed } from '@angular/core/testing'

import { RelationshipDialog } from './relationship-dialog'

describe('RelationshipDialog', () => {
	let component: RelationshipDialog
	let fixture: ComponentFixture<RelationshipDialog>

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [RelationshipDialog]
		})
		.compileComponents()

		fixture = TestBed.createComponent(RelationshipDialog)
		component = fixture.componentInstance
		fixture.detectChanges()
	})

	it('should create', () => {
		expect(component).toBeTruthy()
	})
})
