import { ComponentFixture, TestBed } from '@angular/core/testing'

import { RelationshipCardContentComponent } from './relationship-card-content.component'

describe('RelationshipCardContentComponent', () => {
	let component: RelationshipCardContentComponent
	let fixture: ComponentFixture<RelationshipCardContentComponent>

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [RelationshipCardContentComponent]
		})
		.compileComponents()

		fixture = TestBed.createComponent(RelationshipCardContentComponent)
		component = fixture.componentInstance
		fixture.detectChanges()
	})

	it('should create', () => {
		expect(component).toBeTruthy()
	})
})
