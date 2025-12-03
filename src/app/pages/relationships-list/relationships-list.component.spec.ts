import { ComponentFixture, TestBed } from '@angular/core/testing'

import { RelationshipsListComponent } from './relationships-list.component'

describe('RelationshipsListComponent', () => {
	let component: RelationshipsListComponent
	let fixture: ComponentFixture<RelationshipsListComponent>

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [RelationshipsListComponent]
		})
		.compileComponents()

		fixture = TestBed.createComponent(RelationshipsListComponent)
		component = fixture.componentInstance
		fixture.detectChanges()
	})

	it('should create', () => {
		expect(component).toBeTruthy()
	})
})
