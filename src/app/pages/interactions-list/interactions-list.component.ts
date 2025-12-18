import { AfterViewInit, Component, computed, inject, OnInit, signal, viewChildren } from '@angular/core'
import { RouterLink } from '@angular/router'
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop'
import { filter } from 'rxjs'

import { MatButtonModule } from '@angular/material/button'
import { MatChipsModule } from '@angular/material/chips'
import { MatDialog } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'
import { MatMenuModule } from '@angular/material/menu'
import { MatSnackBar } from '@angular/material/snack-bar'

import { ApiService } from '../../services/api.service'
import { CardComponent } from '../../components/card/card.component'
import { CardGroupComponent } from '../../components/card-group/card-group.component'
import { Interaction, TimeUnit } from "../../interfaces/interaction.interface"
import { InteractionCardContentComponent } from '../../components/interaction-card-content/interaction-card-content.component'
import { InteractionMapperService } from '../../services/mappers/interaction.mapper.service'
import { EditInteractionComponent, InteractionDialogData, InteractionDialogSaveResult } from '../edit-interaction/edit-interaction.component'
import { InteractionsService } from '../../services/interactions.service'
import { PageHeaderBarComponent } from '../../components/page-header-bar/page-header-bar.component'
import { ResponsiveUiService } from '../../services/responsive-ui.service'
import { SNACKBAR_CONFIG, TOPIC_HINT_VERBIAGE } from '../../constants/misc-constants'

@Component({
	selector: 'app-interactions-list',
	standalone: true,
	imports: [
		CardComponent, CardGroupComponent, InteractionCardContentComponent, MatButtonModule,
		MatChipsModule, MatIconModule, MatMenuModule, PageHeaderBarComponent, RouterLink
	],
	templateUrl: './interactions-list.component.html',
	styleUrl: './interactions-list.component.scss'
})
export class InteractionsListComponent implements OnInit, AfterViewInit {
	private readonly api = inject(ApiService)
	private readonly dialog = inject(MatDialog)
	private readonly interactionMapper = inject(InteractionMapperService)
	private readonly interactionsService = inject(InteractionsService)
	private readonly responsiveUiService = inject(ResponsiveUiService)
	private readonly snackBar = inject(MatSnackBar)

	private readonly cardGroups = viewChildren(CardGroupComponent)

	readonly interactions = signal<Interaction[]>([])
	private readonly interactionsSet$ = toObservable(this.cardGroups).pipe(
		takeUntilDestroyed(),
		filter(value => value.length > 0)
	)

	readonly groupBy = signal<TimeUnit>('week')
	readonly groupedInteractions = computed(() => this.interactionsService.groupBy(this.interactions(), this.groupBy()))
	readonly groupByChange$ = toObservable(this.groupBy).pipe(
		takeUntilDestroyed(),
	).subscribe(() => {
		if (this.responsiveUiService.isSmallViewport()) this.onCollapseOrExpandAllClick(false)
		else this.onCollapseOrExpandAllClick(true)
	})

	readonly allGroupsCollapsed = signal(false)
	readonly allGroupsExpanded = signal(false)
	readonly TOPIC_HINT_VERBIAGE = TOPIC_HINT_VERBIAGE
	private readonly SNACKBAR_CONFIG = SNACKBAR_CONFIG

	ngOnInit(): void {
		this.api.getInteractions().subscribe({
			next: interactions => this.interactions.set(interactions),
			error: error => this.snackBar.open('Failed to load interactions.', undefined, this.SNACKBAR_CONFIG)
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
		this.dialog.open(EditInteractionComponent, { data }).afterClosed().subscribe((dataOrCancel: InteractionDialogSaveResult) => {
			if (!dataOrCancel) return
			const { form } = dataOrCancel
			const newInteraction = this.interactionMapper.mapFormToModel(form)
			const updatedInteractions = this.interactionsService.insertInteractionInOrder(this.interactions(), newInteraction)
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
		this.dialog.open(EditInteractionComponent, { data }).afterClosed().subscribe((dataOrCancel: InteractionDialogSaveResult) => {
			if (!dataOrCancel) return
			const { form } = dataOrCancel
			const newInteraction = this.interactionMapper.mapFormToModel(form, editTarget.idOfRelationship, editTarget.nameOfPerson)
			this.interactions.update(interactions =>
				interactions.map(interaction => interaction._id === newInteraction._id ? newInteraction : interaction)
			)
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
