import { AfterViewInit, Component, computed, inject, OnInit, signal, viewChildren } from '@angular/core'
import { RouterLink } from '@angular/router'
import { toObservable } from '@angular/core/rxjs-interop'
import { filter } from 'rxjs'
import { MatButtonModule } from '@angular/material/button'
import { MatChipsModule } from '@angular/material/chips'
import { MatIconModule } from '@angular/material/icon'
import { MatMenuModule } from '@angular/material/menu'
import { MatSnackBar } from '@angular/material/snack-bar'

import { ApiService } from '../../services/api.service'
import { CardComponent } from '../../components/card/card.component'
import { CardGroupComponent } from '../../components/card-group/card-group.component'
import { Interaction, TimeUnit } from "../../interfaces/interaction.interface"
import { InteractionCardContentComponent } from '../../components/interaction-card-content/interaction-card-content.component'
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
	private readonly cardGroups = viewChildren(CardGroupComponent)

	readonly interactions = signal<Interaction[]>([])
	private readonly interactionsSet$ = toObservable(this.cardGroups).pipe(filter(value => value.length > 0))

	readonly groupBy = signal<TimeUnit>('week')
	readonly groupedInteractions = computed(() => this.interactionsService.groupBy(this.interactions(), this.groupBy()))
	readonly groupByChange$ = toObservable(this.groupBy).subscribe(() => {
		if (this.responsiveUiService.isSmallViewport()) this.onCollapseOrExpandAllClick(false)
		else this.onCollapseOrExpandAllClick(true)
	})

	private readonly api = inject(ApiService)
	private readonly interactionsService = inject(InteractionsService)
	private readonly responsiveUiService = inject(ResponsiveUiService)
	private readonly snackBar = inject(MatSnackBar)

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

	onDeleteInteractionClick(deleteTarget: Interaction): void {
		this.interactionsService.deleteInteraction(deleteTarget).subscribe({
			next: targetDeleted => {
				if (!targetDeleted) return
				const deleteIndex = this.interactions().findIndex(({ _id }) => _id === deleteTarget._id)
				this.interactions().splice(deleteIndex, 1)
			},
			error: error => this.snackBar.open('Failed to delete interaction. Try again.', undefined, this.SNACKBAR_CONFIG)
		})
	}

}
