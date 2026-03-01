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

import { ApiService } from '../../services/api.service'
import { CardComponent } from '../../components/card/card.component'
import { CardGroupComponent } from '../../components/card-group/card-group.component'
import { Interaction, InteractionGroup, TimeUnit } from "../../interfaces/interaction.interface"
import { InteractionCardContentComponent } from '../../components/interaction-card-content/interaction-card-content.component'
import { InteractionsService } from '../../services/interactions.service'
import { PageHeaderBarComponent } from '../../components/page-header-bar/page-header-bar.component'
import { RelationshipsService } from '../../services/relationships.service'
import { ResponsiveUiService } from '../../services/responsive-ui.service'
import { RowComponent } from '../../components/row/row.component'
import { TOPIC_HINT_VERBIAGE } from '../../constants/misc-constants'

@Component({
	selector: 'app-interactions-list',
	standalone: true,
	imports: [
		/* angular */ RouterLink,
		/* material: */ MatButtonModule, MatChipsModule, MatIconModule, MatMenuModule, MatProgressSpinnerModule, MatTooltipModule,
		/* app */ CardComponent, CardGroupComponent, InteractionCardContentComponent, PageHeaderBarComponent, RowComponent,
	],
	templateUrl: './interactions-list.component.html',
	styleUrl: './interactions-list.component.scss'
})
export class InteractionsListComponent implements OnInit, AfterViewInit {
	// services
	private readonly api = inject(ApiService)
	private readonly interactionsService = inject(InteractionsService)
	private readonly relationshipsService = inject(RelationshipsService)
	private readonly responsiveUiService = inject(ResponsiveUiService)
	private readonly snackBar = inject(MatSnackBar)

	private readonly cardGroups = viewChildren(CardGroupComponent)

	private readonly interactions = signal<Interaction[]>([])
	private readonly interactionsSet$ = toObservable(this.cardGroups).pipe(
		takeUntilDestroyed(),
		filter(value => value.length > 0)
	)

	// interaction grouping state
	readonly groupBy = signal<TimeUnit>('month')
	readonly groupedInteractions = signal([] as InteractionGroup[])
	private readonly groupInteractions = effect(() => {
		const { groups, groupKey, indexInGroup } = this.interactionsService.groupBy(this.interactions(), this.groupBy(), this.highlightInteraction)
		this.groupedInteractions.set(groups)
		this.highlightedCard.set({ groupKey, indexInGroup })
	}, { allowSignalWrites: true })
	private readonly groupByChange$ = toObservable(this.groupBy).pipe(
		takeUntilDestroyed(),
	).subscribe(() => {
		if (this.responsiveUiService.isSmallViewport()) this.onCollapseOrExpandAllClick(false)
		else this.onCollapseOrExpandAllClick(true)
	})

	// misc state
	readonly allGroupsCollapsed = signal(false)
	readonly allGroupsExpanded = signal(false)
	readonly isLoadingInteractions = signal(true)
	readonly isSmallViewport = this.responsiveUiService.isSmallViewport
	readonly highlightedCard = signal({ groupKey: null, indexInGroup: null } as { groupKey: string|null, indexInGroup: number|null })
	private highlightInteraction = {} as Interaction
	readonly TOPIC_HINT_VERBIAGE = TOPIC_HINT_VERBIAGE

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

	onCollapseOrExpandAllClick(open: boolean): void {
		this.cardGroups().forEach(group => group.open.set(open))
		this.setGroupsCollapsedState()
	}

	onCardGroupHeaderClick(): void {
		this.setGroupsCollapsedState()
	}

	private setGroupsCollapsedState(): void {
		this.allGroupsCollapsed.set(!this.cardGroups().some(group => group.open()))
		this.allGroupsExpanded.set(!this.cardGroups().some(group => !group.open()))
	}

	async onAddInteractionclick(): Promise<void> {
		const { wasCancelled, interaction, updatedInteractions } = await this.interactionsService.addInteraction(this.interactions())
		if (wasCancelled) return

		this.highlightInteraction = interaction
		this.interactions.set(updatedInteractions)
	}

	async onEditInteractionClick(editTarget: Interaction): Promise<void> {
		const { wasCancelled, interaction, updatedInteractions } = await this.interactionsService.editInteraction(editTarget, this.interactions())
		if (wasCancelled) return

		this.highlightInteraction = interaction
		this.interactions.set(updatedInteractions)
	}

	onDeleteInteractionClick(deleteTarget: Interaction): void {
		this.interactionsService.deleteInteraction(deleteTarget).subscribe(targetDeleted => {
			if (!targetDeleted) return

			const deleteIndex = this.interactions().findIndex(({ _id }) => _id === deleteTarget._id)
			this.interactions.set([
				...this.interactions().slice(0, deleteIndex),
				...this.interactions().slice(deleteIndex + 1)
			])
		})
	}

	onEditRelationshipClick(interaction: Interaction): void {
		this.relationshipsService.editRelationship(interaction.idOfRelationship!)
			.subscribe(({ wasCancelled, relationship, wasNameModified, wereInteractionsModified }) => {
				if (wasCancelled) return
				if (wasNameModified) interaction.nameOfPerson = relationship.fullName
				// TODO: optimize by just updating the relevant interactions in the list based on what was changed in the relationship edit flow
				if (wereInteractionsModified) this.loadInteractions()
			})
	}

}
