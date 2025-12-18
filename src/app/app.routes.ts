import { Routes } from '@angular/router'

import { InteractionsListComponent } from './pages/interactions-list/interactions-list.component'
import { PageNotFoundComponent } from './pages/page-not-found/page-not-found.component'
import { RelationshipsListComponent } from './pages/relationships-list/relationships-list.component'

export const routes: Routes = [
	{ path: '', redirectTo: '/relationships', pathMatch: 'full' },
	{ path: 'interactions', title: 'Interactions', component: InteractionsListComponent },
	{ path: 'relationships', title: 'Relationships', component: RelationshipsListComponent	},
	{ path: '**', component: PageNotFoundComponent },
]
