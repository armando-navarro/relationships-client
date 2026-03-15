import { ComponentFixture, TestBed } from '@angular/core/testing'

import { RelationshipsList } from './relationships-list'

describe('RelationshipsList', () => {
	let component: RelationshipsList
	let fixture: ComponentFixture<RelationshipsList>

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [RelationshipsList]
		})
		.compileComponents()

		fixture = TestBed.createComponent(RelationshipsList)
		component = fixture.componentInstance
		fixture.detectChanges()
	})

	it('should create', () => {
		expect(component).toBeTruthy()
	})
})
