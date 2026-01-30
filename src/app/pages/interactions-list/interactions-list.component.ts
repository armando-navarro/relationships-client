import { AfterViewInit, Component, effect, inject, OnInit, signal, viewChildren } from '@angular/core'
import { RouterLink } from '@angular/router'
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop'
import { filter } from 'rxjs'

import { MatButtonModule } from '@angular/material/button'
import { MatChipsModule } from '@angular/material/chips'
import { MatDialog } from '@angular/material/dialog'
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
import { InteractionDialogComponent, InteractionDialogData, InteractionDialogSaveResult } from '../../components/interaction-dialog/interaction-dialog.component'
import { InteractionMapperService } from '../../services/mappers/interaction.mapper.service'
import { InteractionsService } from '../../services/interactions.service'
import { MaterialConfigService } from '../../services/material-config.service'
import { PageHeaderBarComponent } from '../../components/page-header-bar/page-header-bar.component'
import { ResponsiveUiService } from '../../services/responsive-ui.service'
import { TOPIC_HINT_VERBIAGE } from '../../constants/misc-constants'

@Component({
	selector: 'app-interactions-list',
	standalone: true,
	imports: [
		CardComponent, CardGroupComponent, InteractionCardContentComponent, MatButtonModule,
		MatChipsModule, MatIconModule, MatMenuModule, MatProgressSpinnerModule, MatTooltipModule,
		PageHeaderBarComponent, RouterLink,
	],
	templateUrl: './interactions-list.component.html',
	styleUrl: './interactions-list.component.scss'
})
export class InteractionsListComponent implements OnInit, AfterViewInit {
	private readonly api = inject(ApiService)
	private readonly dialog = inject(MatDialog)
	private readonly interactionMapper = inject(InteractionMapperService)
	private readonly interactionsService = inject(InteractionsService)
	private readonly materialConfig = inject(MaterialConfigService)
	private readonly responsiveUiService = inject(ResponsiveUiService)
	private readonly snackBar = inject(MatSnackBar)

	private readonly cardGroups = viewChildren(CardGroupComponent)

	private readonly interactions = signal<Interaction[]>([])
	private readonly interactionsSet$ = toObservable(this.cardGroups).pipe(
		takeUntilDestroyed(),
		filter(value => value.length > 0)
	)

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

	readonly allGroupsCollapsed = signal(false)
	readonly allGroupsExpanded = signal(false)
	readonly isLoadingInteractions = signal(true)
	readonly isSmallViewport = this.responsiveUiService.isSmallViewport
	readonly highlightedCard = signal({ groupKey: null, indexInGroup: null } as { groupKey: string|null, indexInGroup: number|null })
	private highlightInteraction = {} as Interaction
	readonly TOPIC_HINT_VERBIAGE = TOPIC_HINT_VERBIAGE

	ngOnInit(): void {
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

	onAddInteractionclick(): void {
		const data: InteractionDialogData = {
			relationshipId: null,
			relationshipName: null,
			interaction: null,
			isAddingInteraction: true,
			showRelationshipPicker: true,
		}
		const config = this.materialConfig.getResponsiveDialogConfig(data)
		this.dialog.open(InteractionDialogComponent, config).afterClosed().subscribe((dataOrCancel: InteractionDialogSaveResult|false) => {
			if (!dataOrCancel) return
			const { form } = dataOrCancel
			const newInteraction = this.interactionMapper.mapFormToModel(form)
			const updatedInteractions = this.interactionsService.insertInteractionInOrder(this.interactions(), newInteraction)
			this.highlightInteraction = newInteraction
			this.interactions.set(updatedInteractions)
		})
	}

	onEditInteractionClick(editTarget: Interaction): void {
		const data: InteractionDialogData = {
			relationshipId: editTarget.idOfRelationship!,
			relationshipName: editTarget.nameOfPerson!,
			interaction: editTarget,
			isEditingInteraction: true,
		}
		const config = this.materialConfig.getResponsiveDialogConfig(data)
		this.dialog.open(InteractionDialogComponent, config).afterClosed().subscribe((dataOrCancel: InteractionDialogSaveResult|false) => {
			if (!dataOrCancel) return
			const { form } = dataOrCancel
			const newInteraction = this.interactionMapper.mapFormToModel(form, editTarget.idOfRelationship, editTarget.nameOfPerson)
			this.highlightInteraction = newInteraction
			if (editTarget.date === newInteraction.date) {
				// date is unchanged, so interaction stays in same position
				this.interactions.update(interactions =>
					interactions.map(interaction => interaction._id === newInteraction._id ? newInteraction : interaction)
				)
			} else {
				// date changed, so interaction may need to move to a new position
				const interactionsWithoutEdited = this.interactions().filter(interaction => interaction._id !== newInteraction._id)
				const updatedInteractions = this.interactionsService.insertInteractionInOrder(interactionsWithoutEdited, newInteraction)
				this.interactions.set(updatedInteractions)
			}
		})
	}

	onDeleteInteractionClick(deleteTarget: Interaction): void {
		this.interactionsService.deleteInteraction(deleteTarget, deleteTarget.idOfRelationship!, deleteTarget.nameOfPerson!).subscribe(targetDeleted => {
			if (targetDeleted) {
				const deleteIndex = this.interactions().findIndex(({ _id }) => _id === deleteTarget._id)
				this.interactions.set([
					...this.interactions().slice(0, deleteIndex),
					...this.interactions().slice(deleteIndex + 1)
				])
			}
		})
	}

}
