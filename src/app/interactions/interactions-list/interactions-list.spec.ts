import { ComponentFixture, TestBed } from '@angular/core/testing'

import { InteractionsList } from './interactions-list'

describe('InteractionsList', () => {
	let component: InteractionsList
	let fixture: ComponentFixture<InteractionsList>

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [InteractionsList]
		})
		.compileComponents()

		fixture = TestBed.createComponent(InteractionsList)
		component = fixture.componentInstance
		fixture.detectChanges()
	})

	it('should create', () => {
		expect(component).toBeTruthy()
	})
})
