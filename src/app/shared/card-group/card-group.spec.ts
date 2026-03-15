import { ComponentFixture, TestBed } from '@angular/core/testing'

import { CardGroup } from './card-group'

describe('CardGroup', () => {
	let component: CardGroup
	let fixture: ComponentFixture<CardGroup>

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [CardGroup]
		})
		.compileComponents()

		fixture = TestBed.createComponent(CardGroup)
		component = fixture.componentInstance
		fixture.detectChanges()
	})

	it('should create', () => {
		expect(component).toBeTruthy()
	})
})
