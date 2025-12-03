import { inject, Injectable, signal } from '@angular/core'
import { Observable, of } from 'rxjs'

import { ApiService } from './api.service'
import { Interaction } from "../interfaces/interaction.interface"

@Injectable({ providedIn: 'root' })
export class InteractionsService {
	private readonly selectedInteraction = signal<Interaction|undefined>(undefined)

	private readonly api = inject(ApiService)

	getSelectedInteraction(relationshipId?: string, interactionId?: string): Observable<Interaction|undefined> {
		if (!relationshipId) return of(this.selectedInteraction())
		if (!interactionId) throw new Error('Relationship ID and Interaction ID are required')
		if (this.selectedInteraction()?._id === interactionId) return of(this.selectedInteraction())

		return this.api.getInteraction(relationshipId, interactionId)
	}

	setSelectedInteraction(interaction: Interaction|undefined): void {
		this.selectedInteraction.set(interaction)
	}

}
