import { AfterViewInit, Component, effect, inject, OnInit, signal, viewChildren } from '@angular/core'
import { RouterLink } from '@angular/router'
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop'
import { filter } from 'rxjs'

import { MatButtonModule } from '@angular/material/button'
import { MatChipsModule } from '@angular/material/chips'
import { MatIconModule } from '@angular/material/icon'
import { MatMenuModule } from '@angular/material/menu'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatSnackBar } from '@angular/material/snack-bar'
import { MatTooltipModule } from '@angular/material/tooltip'

import { Api } from '../../services/api'
import { Card } from '../../components/card/card'
import { CardGroup } from '../../components/card-group/card-group'
import { Interaction, InteractionGroup, TimeUnit } from '../../interfaces/interaction-interface'
import { InteractionCardContent } from '../../components/interaction-card-content/interaction-card-content'
import { Interactions } from '../../services/interactions'
import { PageHeaderBar } from '../../components/page-header-bar/page-header-bar'
import { Relationships } from '../../services/relationships'
import { ResponsiveUi } from '../../services/responsive-ui'
import { Row } from '../../components/row/row'
import { TOPIC_HINT_VERBIAGE } from '../../constants/misc-constants'

@Component({
	selector: 'app-interactions-list',
	imports: [
		/* angular */ RouterLink,
		/* material: */ MatButtonModule, MatChipsModule, MatIconModule, MatMenuModule, MatProgressSpinnerModule, MatTooltipModule,
		/* app */ Card, CardGroup, InteractionCardContent, PageHeaderBar, Row,
	],
	templateUrl: './interactions-list.html',
	styleUrl: './interactions-list.scss'
})
export class InteractionsList implements OnInit, AfterViewInit {
	// services
	private readonly api = inject(Api)
	private readonly interactionsService = inject(Interactions)
	private readonly relationshipsService = inject(Relationships)
	private readonly responsiveUi = inject(ResponsiveUi)
	private readonly snackBar = inject(MatSnackBar)

	private readonly cardGroups = viewChildren(CardGroup)

	private readonly interactions = signal<Interaction[]>([])
	private readonly interactionsSet$ = toObservable(this.cardGroups).pipe(
		takeUntilDestroyed(),
		filter(value => value.length > 0)
	)

	// interaction grouping state
	protected readonly groupBy = signal<TimeUnit>('month')
	protected readonly groupedInteractions = signal([] as InteractionGroup[])
	private readonly groupByChange$ = toObservable(this.groupBy).pipe(
		takeUntilDestroyed(),
	).subscribe(() => {
		if (this.responsiveUi.isSmallViewport()) this.collapseOrExpandAllGroups(false)
		else this.collapseOrExpandAllGroups(true)
	})

	// misc state
	protected readonly allGroupsCollapsed = signal(false)
	protected readonly allGroupsExpanded = signal(false)
	protected readonly isLoadingInteractions = signal(true)
	protected readonly isSmallViewport = this.responsiveUi.isSmallViewport
	protected readonly highlightedCard = signal({ groupKey: null, indexInGroup: null } as { groupKey: string|null, indexInGroup: number|null })
	private highlightInteraction = {} as Interaction
	protected readonly TOPIC_HINT_VERBIAGE = TOPIC_HINT_VERBIAGE

	constructor() {
		this.keepInteractionsGrouped()
	}

	/** Keep interaction groups and highlighted card metadata in sync with the current interactions and grouping mode. */
	private keepInteractionsGrouped(): void {
		effect(() => {
			const { groups, groupKey, indexInGroup } = this.interactionsService.groupBy(this.interactions(), this.groupBy(), this.highlightInteraction)
			this.groupedInteractions.set(groups)
			this.highlightedCard.set({ groupKey, indexInGroup })
		})
	}

	ngOnInit(): void {
		this.loadInteractions()
	}

	private loadInteractions(): void {
		this.isLoadingInteractions.set(true)
		this.api.getInteractions().subscribe({
			next: interactions => {
				this.interactions.set(interactions)
				this.isLoadingInteractions.set(false)
			},
			error: error => this.snackBar.open('Failed to load interactions.', undefined)
		})
	}

	ngAfterViewInit(): void {
		this.interactionsSet$.subscribe(() => {
			this.setGroupsCollapsedState()
		})
	}

	protected collapseOrExpandAllGroups(open: boolean): void {
		this.cardGroups().forEach(group => group.open.set(open))
		this.setGroupsCollapsedState()
	}

	protected setGroupsCollapsedState(): void {
		this.allGroupsCollapsed.set(!this.cardGroups().some(group => group.open()))
		this.allGroupsExpanded.set(!this.cardGroups().some(group => !group.open()))
	}

	protected async addInteraction(): Promise<void> {
		const { wasCancelled, interaction, updatedInteractions } = await this.interactionsService.addInteraction(this.interactions())
		if (wasCancelled) return

		this.highlightInteraction = interaction
		this.interactions.set(updatedInteractions)
	}

	protected async editInteraction(editTarget: Interaction): Promise<void> {
		const { wasCancelled, interaction, updatedInteractions } = await this.interactionsService.editInteraction(editTarget, this.interactions())
		if (wasCancelled) return

		this.highlightInteraction = interaction
		this.interactions.set(updatedInteractions)
	}

	protected deleteInteraction(deleteTarget: Interaction): void {
		this.interactionsService.deleteInteraction(deleteTarget).subscribe(targetDeleted => {
			if (!targetDeleted) return

			const deleteIndex = this.interactions().findIndex(({ _id }) => _id === deleteTarget._id)
			this.interactions.set([
				...this.interactions().slice(0, deleteIndex),
				...this.interactions().slice(deleteIndex + 1)
			])
		})
	}

	protected editRelationship(interaction: Interaction): void {
		this.relationshipsService.editRelationship(interaction.idOfRelationship!)
			.subscribe(({ wasCancelled, relationship, wasNameModified, wereInteractionsModified }) => {
				if (wasCancelled) return
				if (wasNameModified) interaction.nameOfPerson = relationship.fullName
				// TODO: optimize by just updating the relevant interactions in the list based on what was changed in the relationship edit flow
				if (wereInteractionsModified) this.loadInteractions()
			})
	}

}
