import { ComponentFixture, TestBed } from '@angular/core/testing'

import { RelationshipCardContent } from './relationship-card-content'

describe('RelationshipCardContent', () => {
	let component: RelationshipCardContent
	let fixture: ComponentFixture<RelationshipCardContent>

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [RelationshipCardContent]
		})
		.compileComponents()

		fixture = TestBed.createComponent(RelationshipCardContent)
		component = fixture.componentInstance
		fixture.detectChanges()
	})

	it('should create', () => {
		expect(component).toBeTruthy()
	})
})
