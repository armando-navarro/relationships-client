import { Routes } from '@angular/router'

import { InteractionsList } from './pages/interactions-list/interactions-list'
import { PageNotFound } from './pages/page-not-found/page-not-found'
import { RelationshipsList } from './pages/relationships-list/relationships-list'
import { Welcome } from './pages/welcome/welcome'

export const routes: Routes = [
	{ path: '', redirectTo: '/welcome', pathMatch: 'full' },
	{ path: 'welcome', title: 'Welcome', component: Welcome },
	{ path: 'interactions', title: 'Interactions', component: InteractionsList },
	{ path: 'relationships', title: 'Relationships', component: RelationshipsList	},
	{ path: '**', component: PageNotFound },
]
