import { Component, computed, effect, inject, OnInit, signal, viewChildren } from '@angular/core'
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
import { MatSnackBar } from '@angular/material/snack-bar'

import { ApiService } from '../../services/api.service'
import { CardComponent } from '../../components/card/card.component'
import { CardGroupComponent } from '../../components/card-group/card-group.component'
import { AttentionNeededStatus, Relationship, RelationshipGroup, RelationshipsGroupedByStatus } from '../../interfaces/relationship.interface'
import { PageHeaderBarComponent } from '../../components/page-header-bar/page-header-bar.component'
import { RelationshipsService } from '../../services/relationships.service'
import { RelationshipCardContentComponent } from '../../components/relationship-card-content/relationship-card-content.component'
import { SNACKBAR_CONFIG } from '../../constants/misc-constants'

@Component({
	selector: 'app-relationships-list',
	standalone: true,
	imports: [
		CardComponent, CardGroupComponent, FormsModule, MatAutocompleteModule, MatButtonModule, MatFormFieldModule,
		MatMenuModule, MatIconModule, MatInputModule, PageHeaderBarComponent, RelationshipCardContentComponent,
		RouterLink,
	],
	templateUrl: './relationships-list.component.html',
	styleUrl: './relationships-list.component.scss'
})
export class RelationshipsListComponent implements OnInit {
	private readonly cardGroups = viewChildren(CardGroupComponent)

	// services
	private readonly api = inject(ApiService)
	private readonly relationshipsService = inject(RelationshipsService)
	private readonly snackBar = inject(MatSnackBar)

	// relationship data processing
	readonly groupedRelationships = signal<RelationshipGroup[]>([])
	readonly ungroupedRelationships = computed(() => this.groupedRelationships().flatMap(({ relationships }) => relationships))
	readonly relationshipNames = computed(() =>
		this.relationshipsService.sortByFirstName(this.ungroupedRelationships()).map(({ fullName }) => fullName!) || []
	)
	readonly hasRelationships = computed(() => this.groupedRelationships().some(group => group.relationships.length))

	// search filter processing
	readonly searchValue = signal('')
	readonly searchValueSub = toObservable(this.searchValue).pipe(
		takeUntilDestroyed(),
		debounceTime(300),
		distinctUntilChanged(),
	).subscribe(searchValue => {
		const { filteredNames, filteredGroups } = this.applySearchFilter(searchValue)
		this.filteredNames.set(filteredNames)
		this.filteredGroupedRelationships.set(filteredGroups)
	})
	readonly filteredNames = signal<string[]>(this.relationshipNames())
	readonly filteredGroupedRelationships = signal<RelationshipGroup[]>(this.groupedRelationships() || [])
	readonly filterEffect = effect(() => this.applySearchFilter(this.searchValue()), { allowSignalWrites: true })

	// misc
	readonly allGroupsCollapsed = signal(false)
	readonly allGroupsExpanded = signal(false)
	private readonly SNACKBAR_CONFIG = SNACKBAR_CONFIG

	ngOnInit(): void {
		this.api.getRelationshipsGroupedByStatus().subscribe({
			next: groupedRelationships => {
				this.initGroups(groupedRelationships)
				// wait a tick for the groups to collapse themselves on small viewports
				setTimeout(() => this.setGroupsCollapsedState())
			},
			error: error => this.snackBar.open('Failed to load relationships.', undefined, this.SNACKBAR_CONFIG)
		})
	}

	private initGroups(groupedRelationships: RelationshipsGroupedByStatus): void {
		this.groupedRelationships.set([
			groupedRelationships[AttentionNeededStatus.Today],
			groupedRelationships[AttentionNeededStatus.Overdue],
			groupedRelationships[AttentionNeededStatus.Soon],
			groupedRelationships[AttentionNeededStatus.Good],
			groupedRelationships[AttentionNeededStatus.NotAvailable],
		])
	}

	private applySearchFilter(searchValue: string): { filteredNames: string[], filteredGroups: RelationshipGroup[] } {
		const lowerSearchValue = searchValue.toLowerCase().trim()

		// no filter
		if (!lowerSearchValue) return { filteredNames: this.relationshipNames(), filteredGroups: this.groupedRelationships() }

		// filter autocomplete suggested names
		const filteredNames = this.relationshipNames().filter(name => name.toLowerCase().includes(lowerSearchValue))

		// filter grouped relationships
		const filteredGroups = this.groupedRelationships().map<RelationshipGroup>(({ status, statusColor, relationships }) => ({
			status,
			statusColor,
			relationships: relationships.filter(({ fullName }) => fullName?.toLowerCase().includes(lowerSearchValue))
		}))
		return { filteredNames, filteredGroups }
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

	onDeleteRelationshipClick(deleteTarget: Relationship): void {
		this.relationshipsService.deleteRelationship(deleteTarget).subscribe({
			next: targetDeleted => {
				if (!targetDeleted) return

				this.groupedRelationships().forEach(group => {
					const deleteIndex = group.relationships.findIndex(({ _id }) => _id === deleteTarget._id)
					if (deleteIndex > -1) group.relationships.splice(deleteIndex, 1)
				})
			},
			error: error => this.snackBar.open('Failed to delete relationship. Try again.', undefined, this.SNACKBAR_CONFIG)
		})
	}

}
