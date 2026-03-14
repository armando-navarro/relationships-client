import { booleanAttribute, Component, computed, effect, ElementRef, inject, input, model, OnInit, output, signal } from '@angular/core'

import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatTooltipModule } from '@angular/material/tooltip'

import { DynamicScrollable } from '../dynamic-scrollable/dynamic-scrollable'
import { Interaction, Topic } from '../../interfaces/interaction-interface'
import { NewlinesToBrPipe } from '../../pipes/newlines-to-br-pipe'
import { Relationship } from '../../interfaces/relationship-interface'
import { SimpleDatePipe } from '../../pipes/simple-date-pipe'

@Component({
	selector: 'app-card',
	imports: [DynamicScrollable, MatButtonModule, MatIconModule, MatTooltipModule],
	providers: [NewlinesToBrPipe, SimpleDatePipe],
	templateUrl: './card.html',
	styleUrl: './card.scss',
	host: {
		'[class.hidden]': '!open()',
		'[class.highlight]': 'scrollToAndHighlight()',
	}
})
export class Card implements OnInit {
	private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef)
	private readonly newlinesToBr = inject(NewlinesToBrPipe)
	private readonly simpleDate = inject(SimpleDatePipe)

	readonly relationship = input<Relationship>()
	readonly interaction = input<Interaction>()
	readonly topic = input<Topic>()
	readonly hideFooter = input(false, { alias: 'hide-footer', transform: booleanAttribute })
	readonly collapsible = input(false, { transform: booleanAttribute })
	readonly scrollableBody = input(false, { alias: 'scrollable-body', transform: booleanAttribute })
	readonly alwaysShowLeftText = input(false, { alias: 'always-show-left-text', transform: booleanAttribute })
	readonly alwaysShowInteractionOwner = input(false, { alias: 'always-show-interaction-owner', transform: booleanAttribute })
	readonly scrollToAndHighlight = model(false, { alias: 'scroll-to-and-highlight' })

	readonly editRelationshipEmitter = output<Relationship>({ alias: 'edit-relationship'})
	readonly editInteraction = output<Interaction>({ alias: 'edit-interaction'})
	readonly editTopic = output({ alias: 'edit-topic'})
	readonly deleteRelationship = output<Relationship>({ alias: 'delete-relationship'})
	readonly deleteInteraction = output<Interaction>({ alias: 'delete-interaction'})
	readonly deleteTopic = output({ alias: 'delete-topic'})
	readonly relationshipNameClick = output<Interaction>({ alias: 'relationship-name-click' })

	readonly open = model(true)

	protected readonly collapsedLeftText = signal('')
	protected readonly collapsedRightText = signal('')
	protected readonly collapsedRightIcon = signal('')

	readonly relationshipId = computed(() => this.relationship()?._id || this.interaction()?.idOfRelationship)
	protected readonly relationshipName = computed(() => this.relationship()?.fullName || this.interaction()?.nameOfPerson)
	protected readonly modelName = computed(() => {
		if (this.relationship()) return 'relationship'
		else if (this.interaction()) return 'interaction'
		else return 'topic'
	})

	constructor() {
		this.scrollToAndClearHighlightWhenHighlighted()
		this.syncOpenStateWithCollapsibleInput()
	}

	/** When highlighted, scroll to this card and clear the highlight after the animation completes. */
	private scrollToAndClearHighlightWhenHighlighted(): void {
		effect(() => {
			if (this.scrollToAndHighlight()) {
				this.hostRef.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
				setTimeout(() => this.scrollToAndHighlight.set(false), 2250)
			}
		})
	}

	/** Keep the card's open state in sync with the collapsible input. */
	private syncOpenStateWithCollapsibleInput(): void {
		effect(() => { this.open.set(!this.collapsible()) })
	}

	ngOnInit(): void {
		if (this.relationship()) this.initRelationshipCard(this.relationship()!)
		else if (this.interaction()) this.initInteractionCard(this.interaction()!)
		else if (this.topic()) this.initTopicCard(this.topic()!)
	}

	private initRelationshipCard(relationship: Relationship): void {
		this.collapsedLeftText.set(relationship.fullName)
		this.collapsedRightText.set(`${(this.simpleDate.transform(relationship.lastInteractionDate))}`)
	}

	private initInteractionCard(interaction: Interaction): void {
		const date = new Date(interaction.date!).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
		if (this.alwaysShowInteractionOwner()) {
			this.collapsedLeftText.set(interaction.nameOfPerson!)
			this.collapsedRightText.set(date)
		}
		else {
			this.collapsedLeftText.set(date)
			this.collapsedRightText.set(this.newlinesToBr.transform(interaction.topics[0]?.notes) || 'No notes')
		}
		this.collapsedRightIcon.set(interaction.typeIcon || '')
	}

	private initTopicCard(topic: Topic): void {
		this.collapsedLeftText.set(topic.name)
		this.collapsedRightText.set(this.newlinesToBr.transform(topic.notes))
	}

	protected editRelationship() {
		if (this.relationship()) this.editRelationshipEmitter.emit(this.relationship()!)
		else this.relationshipNameClick.emit(this.interaction()!)
	}

	protected edit(): void {
		if (this.interaction()) this.editInteraction.emit(this.interaction()!)
		else if (this.relationship()) this.editRelationshipEmitter.emit(this.relationship()!)
		else this.editTopic.emit()
	}

	protected delete(): void {
		if (this.relationship()) this.deleteRelationship.emit(this.relationship()!)
		else if (this.interaction()) this.deleteInteraction.emit(this.interaction()!)
		else this.deleteTopic.emit()
	}

	protected toggleCollapseExpand(): void {
		this.open.set(!this.open())
		setTimeout(() => {
			this.hostRef.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
		}, 500) // wait for the CSS transition to complete
	}

}
