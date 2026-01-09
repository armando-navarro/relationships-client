import { booleanAttribute, Component, computed, effect, ElementRef, inject, input, model, OnInit, output, signal } from '@angular/core'
import { NgStyle } from '@angular/common'

import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatTooltipModule } from '@angular/material/tooltip'

import { DynamicScrollableComponent } from "../dynamic-scrollable/dynamic-scrollable.component"
import { Interaction, Topic } from '../../interfaces/interaction.interface'
import { NewlinesToBrPipe } from '../../pipes/newlines-to-br.pipe'
import { Relationship } from '../../interfaces/relationship.interface'

@Component({
	selector: 'app-card',
	standalone: true,
	imports: [DynamicScrollableComponent, MatButtonModule, MatIconModule, MatTooltipModule, NgStyle],
	providers: [NewlinesToBrPipe],
	templateUrl: './card.component.html',
	styleUrl: './card.component.scss',
	host: {
		'[class.hidden]': '!open()',
		'[class.highlight]': 'scrollToAndHighlight()',
	}
})
export class CardComponent implements OnInit {
	private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef)
	private readonly newlinesToBr = inject(NewlinesToBrPipe)

	readonly relationship = input<Relationship>()
	readonly interaction = input<Interaction>()
	readonly topic = input<Topic>()
	readonly hideFooter = input(false, { alias: 'hide-footer', transform: booleanAttribute })
	readonly collapsible = input(false, { transform: booleanAttribute })
	readonly scrollableBody = input(false, { alias: 'scrollable-body', transform: booleanAttribute })
	readonly alwaysShowLeftText = input(false, { alias: 'always-show-left-text', transform: booleanAttribute })
	readonly scrollToAndHighlight = model(false, { alias: 'scroll-to-and-highlight' })

	readonly editRelationship = output<Relationship>({ alias: 'edit-relationship'})
	readonly editInteraction = output<Interaction>({ alias: 'edit-interaction'})
	readonly editTopic = output({ alias: 'edit-topic'})
	readonly deleteRelationship = output<Relationship>({ alias: 'delete-relationship'})
	readonly deleteInteraction = output<Interaction>({ alias: 'delete-interaction'})
	readonly deleteTopic = output({ alias: 'delete-topic'})

	readonly open = model(true)

	readonly collapsedLeftText = signal('')
	readonly collapsedRightText = signal('')
	readonly collapsedRightIcon = signal('')

	readonly relationshipId = computed(() => this.relationship()?._id || this.interaction()?.idOfRelationship)
	readonly relationshipName = computed(() => this.relationship()?.fullName || this.interaction()?.nameOfPerson)
	readonly modelName = computed(() => {
		if (this.relationship()) return 'relationship'
		else if (this.interaction()) return 'interaction'
		else return 'topic'
	})

	constructor() {
		// highlight card
		effect(() => {
			if (this.scrollToAndHighlight()) {
				this.hostRef.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
				setTimeout(() => this.scrollToAndHighlight.set(false), 2250)
			}
		})
		// start card closed if collapsible
		effect(() => { if (this.collapsible()) this.open.set(false) }, { allowSignalWrites: true })
	}

	ngOnInit(): void {
		if (this.relationship()) this.initRelationshipCard(this.relationship()!)
		else if (this.interaction()) this.initInteractionCard(this.interaction()!)
		else if (this.topic()) this.initTopicCard(this.topic()!)
	}

	private initRelationshipCard(relationship: Relationship): void {
		this.collapsedLeftText.set(relationship.fullName)
		this.collapsedRightText.set(`${(relationship.lastInteractionRelativeTime || 'N/A')}`)
	}

	private initInteractionCard(interaction: Interaction): void {
		const date = new Date(interaction.date!)
		this.collapsedLeftText.set(date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }))
		this.collapsedRightText.set(this.newlinesToBr.transform(interaction.topics[0]?.notes) || 'No notes')
		this.collapsedRightIcon.set(interaction.typeIcon || '')
	}

	private initTopicCard(topic: Topic): void {
		this.collapsedLeftText.set(topic.name)
		this.collapsedRightText.set(this.newlinesToBr.transform(topic.notes))
	}

	onEditClick(): void {
		if (this.interaction()) this.editInteraction.emit(this.interaction()!)
		else if (this.relationship()) this.editRelationship.emit(this.relationship()!)
		else this.editTopic.emit()
	}

	onDeleteClick(): void {
		if (this.relationship()) this.deleteRelationship.emit(this.relationship()!)
		else if (this.interaction()) this.deleteInteraction.emit(this.interaction()!)
		else this.deleteTopic.emit()
	}

	onCollapseExpandClick(): void {
		this.open.set(!this.open())
		setTimeout(() => {
			this.hostRef.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
		}, 500) // wait for the CSS transition to complete
	}

}
