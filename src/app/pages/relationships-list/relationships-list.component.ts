import { Component, computed, inject, OnInit, signal, viewChildren } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop'
import { debounceTime, distinctUntilChanged } from 'rxjs'

import { MatAutocompleteModule } from '@angular/material/autocomplete'
import { MatButtonModule } from '@angular/material/button'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatMenuModule } from '@angular/material/menu'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatSnackBar } from '@angular/material/snack-bar'
import { MatTooltipModule } from '@angular/material/tooltip'

import { ApiService } from '../../services/api.service'
import { CardComponent } from '../../components/card/card.component'
import { CardGroupComponent } from '../../components/card-group/card-group.component'
import { AttentionNeededStatus, Relationship, RelationshipGroup } from '../../interfaces/relationship.interface'
import { PageHeaderBarComponent } from '../../components/page-header-bar/page-header-bar.component'
import { RelationshipsService } from '../../services/relationships.service'
import { RelationshipCardContentComponent } from '../../components/relationship-card-content/relationship-card-content.component'
import { RelationshipUtilitiesService } from '../../services/relationship-utilities.service'
import { ResponsiveUiService } from '../../services/responsive-ui.service'
import { RowComponent } from '../../components/row/row.component'

@Component({
	selector: 'app-relationships-list',
	standalone: true,
	imports: [
		CardComponent, CardGroupComponent, FormsModule, MatAutocompleteModule, MatButtonModule, MatFormFieldModule,
		MatMenuModule, MatIconModule, MatInputModule, MatProgressSpinnerModule, MatTooltipModule, PageHeaderBarComponent,
		RelationshipCardContentComponent, RouterLink, RowComponent,
	],
	templateUrl: './relationships-list.component.html',
	styleUrl: './relationships-list.component.scss',
	host: {
		'[class.two-header-rows]': 'showSearchBar()'
	}
})
export class RelationshipsListComponent implements OnInit {
	// services
	private readonly api = inject(ApiService)
	private readonly relationshipsService = inject(RelationshipsService)
	private readonly relationshipUtils = inject(RelationshipUtilitiesService)
	private readonly responsiveUiService = inject(ResponsiveUiService)
	private readonly snackBar = inject(MatSnackBar)

	private readonly cardGroups = viewChildren(CardGroupComponent)

	// relationship data processing
	readonly groupedRelationships = signal<RelationshipGroup[]>([])
	readonly ungroupedRelationships = computed(() => this.groupedRelationships().flatMap(({ relationships }) => relationships))
	readonly relationshipNames = computed(() =>
		this.relationshipUtils.sortByFirstName(this.ungroupedRelationships()).map(({ fullName }) => fullName!) || []
	)
	readonly hasRelationships = computed(() => this.groupedRelationships().some(group => group.relationships.length))

	// search filter processing
	readonly searchValue = signal('')
	readonly searchValueSub = toObservable(this.searchValue).pipe(
		takeUntilDestroyed(),
		debounceTime(300),
		distinctUntilChanged(),
	).subscribe(searchValue => this.applySearchFilter(searchValue))
	readonly filteredNames = signal<string[]>(this.relationshipNames())
	readonly filteredGroupedRelationships = signal<RelationshipGroup[]>(this.groupedRelationships() || [])
	readonly showSearchBar = signal(false)

	// misc
	readonly allGroupsCollapsed = signal(false)
	readonly allGroupsExpanded = signal(false)
	readonly isLoadingRelationships = signal(true)
	readonly isSmallViewport = this.responsiveUiService.isSmallViewport
	readonly highlightedCard = signal({ groupStatus: null, indexInGroup: null } as { groupStatus: AttentionNeededStatus|null, indexInGroup: number|null })

	ngOnInit(): void {
		this.api.getRelationshipsGroupedByStatus().subscribe({
			next: groupedRelationships => {
				this.groupedRelationships.set(groupedRelationships)
				this.filteredGroupedRelationships.set(this.groupedRelationships())
				this.isLoadingRelationships.set(false)
				// wait a tick for the groups to collapse themselves on small viewports
				setTimeout(() => this.setGroupsCollapsedState())
			},
			error: error => this.snackBar.open('Failed to load relationships.', undefined)
		})
	}

	onSearchClick(showSearch = !this.showSearchBar()): void {
		this.showSearchBar.set(showSearch)
		if (!showSearch) this.searchValue.set('')
	}

	private applySearchFilter(searchValue: string): void {
		const lowerSearchValue = searchValue.toLowerCase().trim()
		let filteredNames = this.relationshipNames()
		let filteredGroups = this.groupedRelationships()

		if (lowerSearchValue) {
			// filter autocomplete suggested names
			filteredNames = this.relationshipNames().filter(name => name.toLowerCase().includes(lowerSearchValue))

			// filter grouped relationships
			filteredGroups = this.groupedRelationships().map<RelationshipGroup>(({ status, statusColor, relationships }) => ({
				status,
				statusColor,
				relationships: relationships.filter(({ fullName }) => fullName?.toLowerCase().includes(lowerSearchValue))
			}))
		}
		this.filteredNames.set(filteredNames)
		this.filteredGroupedRelationships.set(filteredGroups)
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

	onAddRelationshipClick(): void {
		this.relationshipsService.addRelationship(this.groupedRelationships())
			.subscribe(({ wasCancelled, groups, targetGroupStatus, targetRelationshipIndex }) => {
				if (wasCancelled) return
				this.groupedRelationships.set(groups)
				this.highlightedCard.set({ groupStatus: targetGroupStatus, indexInGroup: targetRelationshipIndex })
			})
	}

	onEditRelationshipClick(editTarget: Relationship): void {
		this.relationshipsService.editRelationship(editTarget, this.groupedRelationships())
			.subscribe(({ wasCancelled, groups, targetGroupStatus, targetRelationshipIndex }) => {
				if (wasCancelled) return
				this.groupedRelationships.set(groups)
				this.filteredGroupedRelationships.set(this.groupedRelationships())
				this.applySearchFilter(this.searchValue())
				this.highlightedCard.set({ groupStatus: targetGroupStatus, indexInGroup: targetRelationshipIndex })
			})
	}

	onDeleteRelationshipClick(deleteTarget: Relationship): void {
		this.relationshipsService.deleteRelationship(deleteTarget).subscribe(targetDeleted => {
			if (targetDeleted) {
				this.groupedRelationships().forEach(group => {
					const deleteIndex = group.relationships.findIndex(({ _id }) => _id === deleteTarget._id)
					if (deleteIndex > -1) {
						group.relationships = [
							...group.relationships.slice(0, deleteIndex),
							...group.relationships.slice(deleteIndex + 1)
						]
					}
				})
			}
		})
	}

}
