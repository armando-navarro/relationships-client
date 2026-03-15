import { Routes } from '@angular/router'

import { InteractionsList } from './interactions/interactions-list/interactions-list'
import { PageNotFound } from './page-not-found/page-not-found'
import { RelationshipsList } from './relationships/relationships-list/relationships-list'
import { Welcome } from './welcome/welcome'

export const routes: Routes = [
	{ path: '', redirectTo: '/welcome', pathMatch: 'full' },
	{ path: 'welcome', title: 'Welcome', component: Welcome },
	{ path: 'interactions', title: 'Interactions', component: InteractionsList },
	{ path: 'relationships', title: 'Relationships', component: RelationshipsList	},
	{ path: '**', component: PageNotFound },
]
