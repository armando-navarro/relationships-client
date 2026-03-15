import { Component, computed, effect, inject, linkedSignal, OnInit, signal, viewChildren } from '@angular/core'
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

import { Api } from '../../services/api'
import { Card } from '../../components/card/card'
import { CardGroup } from '../../components/card-group/card-group'
import { AttentionNeededStatus, Relationship, RelationshipGroup } from '../../interfaces/relationship-interface'
import { PageHeaderBar } from '../../components/page-header-bar/page-header-bar'
import { Relationships } from '../../services/relationships'
import { RelationshipCardContent } from '../../components/relationship-card-content/relationship-card-content'
import { RelationshipUtilities } from '../../services/relationship-utilities'
import { ResponsiveUi } from '../../services/responsive-ui'
import { Row } from '../../components/row/row'

@Component({
	selector: 'app-relationships-list',
	imports: [
		Card, CardGroup, FormsModule, MatAutocompleteModule, MatButtonModule, MatFormFieldModule,
		MatMenuModule, MatIconModule, MatInputModule, MatProgressSpinnerModule, MatTooltipModule, PageHeaderBar,
		RelationshipCardContent, RouterLink, Row,
	],
	templateUrl: './relationships-list.html',
	styleUrl: './relationships-list.scss',
	host: {
		'[class.two-header-rows]': 'showSearchBar()'
	}
})
export class RelationshipsList implements OnInit {
	// services
	private readonly api = inject(Api)
	private readonly relationshipsService = inject(Relationships)
	private readonly relationshipUtils = inject(RelationshipUtilities)
	protected readonly responsiveUi = inject(ResponsiveUi)
	private readonly snackBar = inject(MatSnackBar)

	private readonly cardGroups = viewChildren(CardGroup)

	// relationship data processing
	protected readonly groupedRelationships = signal<RelationshipGroup[]>([])
	readonly ungroupedRelationships = computed(() => this.groupedRelationships().flatMap(({ relationships }) => relationships))
	readonly relationshipNames = computed(() =>
		this.relationshipUtils.sortByFirstName(this.ungroupedRelationships()).map(({ fullName }) => fullName!) || []
	)
	protected readonly hasRelationships = computed(() => this.groupedRelationships().some(group => group.relationships.length))

	// search filter processing
	protected readonly searchValue = signal('')
	readonly searchValueSub = toObservable(this.searchValue).pipe(
		takeUntilDestroyed(),
		debounceTime(300),
		distinctUntilChanged(),
	).subscribe(searchValue => this.applySearchFilter(searchValue))
	protected readonly filteredNames = signal<string[]>(this.relationshipNames())
	protected readonly filteredGroupedRelationships = linkedSignal(() => this.groupedRelationships() || [])
	protected readonly showSearchBar = signal(false)

	// misc
	protected readonly showExpandAllGroupsButton = signal(false)
	protected readonly showCollapseAllGroupsButton = signal(false)
	protected readonly isLoadingRelationships = signal(true)
	protected readonly highlightedCard = signal({ groupStatus: null, indexInGroup: null } as { groupStatus: AttentionNeededStatus|null, indexInGroup: number|null })

	constructor() {
		this.syncExpandCollapseAllButtonsWithGroupStates()
	}

	/** Update visibility of "expand/collapse all groups" buttons when groups are added/removed or when a group is collapsed/expanded */
	private syncExpandCollapseAllButtonsWithGroupStates(): void {
		effect(() => {
			this.showExpandAllGroupsButton.set(!this.cardGroups().every(group => group.open()))
			this.showCollapseAllGroupsButton.set(!this.cardGroups().every(group => !group.open()))
		})
	}

	ngOnInit(): void {
		this.api.getRelationshipsGroupedByStatus().subscribe({
			next: groupedRelationships => {
				this.groupedRelationships.set(groupedRelationships)
				this.isLoadingRelationships.set(false)
			},
			error: error => this.snackBar.open('Failed to load relationships.', undefined)
		})
	}

	/** Toggle the search bar and clear the current query when it is hidden. */
	protected showHideSearchBar(showSearch = !this.showSearchBar()): void {
		this.showSearchBar.set(showSearch)
		if (!showSearch) this.searchValue.set('')
	}

	/** Filter relationship groups and autocomplete suggestions by the current search value. */
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

	/** Expand or collapse every relationship group. */
	protected collapseOrExpandAllGroups(open: boolean): void {
		this.cardGroups().forEach(group => group.open.set(open))
	}

	/** Open the add-relationship flow and highlight the newly inserted relationship. */
	protected addRelationship(): void {
		this.relationshipsService.addRelationship(this.groupedRelationships())
			.subscribe(({ wasCancelled, groups, targetGroupStatus, targetRelationshipIndex }) => {
				if (wasCancelled) return
				this.groupedRelationships.set(groups)
				this.highlightedCard.set({ groupStatus: targetGroupStatus, indexInGroup: targetRelationshipIndex })
			})
	}

	/** Open the edit-relationship flow and update the filtered view with the saved result. */
	protected editRelationship(editTarget: Relationship): void {
		this.relationshipsService.editRelationship(editTarget, this.groupedRelationships())
			.subscribe(({ wasCancelled, groups, targetGroupStatus, targetRelationshipIndex }) => {
				if (wasCancelled) return
				this.groupedRelationships.set(groups)
				this.applySearchFilter(this.searchValue())
				this.highlightedCard.set({ groupStatus: targetGroupStatus, indexInGroup: targetRelationshipIndex })
			})
	}

	/** Delete a relationship after confirmation. */
	protected deleteRelationship(deleteTarget: Relationship): void {
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
