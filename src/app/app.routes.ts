import { Routes } from '@angular/router'

import { EditInteractionComponent } from './pages/edit-interaction/edit-interaction.component'
import { EditRelationshipComponent } from './pages/edit-relationship/edit-relationship.component'
import { InteractionsListComponent } from './pages/interactions-list/interactions-list.component'
import { PageNotFoundComponent } from './pages/page-not-found/page-not-found.component'
import { RelationshipsListComponent } from './pages/relationships-list/relationships-list.component'

export const routes: Routes = [
	{ path: '', redirectTo: '/relationships', pathMatch: 'full' },
	{ path: 'interactions', title: 'Interactions', component: InteractionsListComponent },
	{ path: 'relationships', title: 'Relationships', component: RelationshipsListComponent	},
	{ path: 'relationships/add', title: 'Add Relationship', component: EditRelationshipComponent, data: { isAddingRelationship: true } },
	{ path: 'relationships/add/interactions/add', title: 'Add Interaction', component: EditInteractionComponent, data: { isAddingInteraction: true, isAddingRelationship: true } },
	{ path: 'relationships/add/interactions/edit', title: 'Edit Interaction', component: EditInteractionComponent, data: { isAddingInteraction: false, isAddingRelationship: true } },
	{ path: 'relationships/:relationshipId/edit', title: 'Edit Relationship', component: EditRelationshipComponent },
	{ path: 'interactions/add', title: 'Add Interaction', component: EditInteractionComponent, data: { isAddingInteraction: true, isAddingRelationship: false } },
	{ path: 'relationships/:relationshipId/interactions/add', title: 'Add Interaction', component: EditInteractionComponent, data: { isAddingInteraction: true, isAddingRelationship: false } },
	{ path: 'relationships/:relationshipId/interactions/:interactionId/edit', title: 'Edit Interaction', component: EditInteractionComponent, data: { isAddingInteraction: false, isAddingRelationship: false } },
	{ path: '**', component: PageNotFoundComponent },
]
