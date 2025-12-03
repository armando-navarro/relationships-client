import { ComponentFixture, TestBed } from '@angular/core/testing'

import { InteractionsListComponent } from './interactions-list.component'

describe('InteractionsListComponent', () => {
	let component: InteractionsListComponent
	let fixture: ComponentFixture<InteractionsListComponent>

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [InteractionsListComponent]
		})
		.compileComponents()

		fixture = TestBed.createComponent(InteractionsListComponent)
		component = fixture.componentInstance
		fixture.detectChanges()
	})

	it('should create', () => {
		expect(component).toBeTruthy()
	})
})
