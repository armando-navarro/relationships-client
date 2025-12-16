import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { map, Observable } from 'rxjs'

import { environment } from '../../environments/environment'
import { InsertedId } from "../interfaces/misc.interface"
import { Interaction, InteractionPayload, InteractionResponse } from "../interfaces/interaction.interface"
import { InteractionMapperService } from './mappers/interaction.mapper.service'
import {
	Relationship,
	RelationshipPayload,
	RelationshipResponse,
	RelationshipsGroupedByStatus,
	RelationshipsGroupedByStatusResponse
} from '../interfaces/relationship.interface'
import { RelationshipMapperService } from './mappers/relationship.mapper.service'

@Injectable({ providedIn: 'root' })
export class ApiService {
	private baseUrl = environment.apiUrl
	private readonly http = inject(HttpClient)
	private readonly interactionMapper = inject(InteractionMapperService)
	private readonly relationshipMapper = inject(RelationshipMapperService)

	//#region Relationship endpoints

	getRelationshipsGroupedByStatus(): Observable<RelationshipsGroupedByStatus> {
		return this.http.get<RelationshipsGroupedByStatusResponse>(`${this.baseUrl}/relationships`).pipe(
			map(groupedRelationships => this.relationshipMapper.mapGroupedByStatusResponseToModel(groupedRelationships))
		)
	}

	getRelationship(id: string): Observable<Relationship> {
		return this.http.get<RelationshipResponse>(`${this.baseUrl}/relationships/${id}`).pipe(
			map(relationship => this.relationshipMapper.mapResponseToModel(relationship))
		)
	}

	addRelationship(relationship: RelationshipPayload): Observable<InsertedId> {
		return this.http.post<InsertedId>(`${this.baseUrl}/relationships`, relationship)
	}

	updateRelationship(relationship: RelationshipPayload): Observable<void> {
		relationship.interactions?.forEach(interaction => delete interaction.idOfRelationship)
		return this.http.put<void>(`${this.baseUrl}/relationships/${relationship._id}`, relationship)
	}

	deleteRelationship(relationshipId: string): Observable<true> {
		return this.http.delete<true>(`${this.baseUrl}/relationships/${relationshipId}`).pipe(
			map(() => true)
		)
	}
	//#endregion

	//#region Interaction endpoints

	getInteractions(): Observable<Interaction[]> {
		return this.http.get<InteractionResponse[]>(`${this.baseUrl}/interactions`).pipe(
			map(interactions => this.interactionMapper.mapResponseToModel(interactions))
		)
	}

	getInteraction(relationshipId: string, interactionId: string): Observable<Interaction> {
		return this.http.get<InteractionResponse>(`${this.baseUrl}/relationships/${relationshipId}/interactions/${interactionId}`).pipe(
			map(interaction => this.interactionMapper.mapResponseToModel(interaction))
		)
	}

	addInteraction(interaction: InteractionPayload, relationshipId: string): Observable<InsertedId> {
		return this.http.post<InsertedId>(`${this.baseUrl}/relationships/${relationshipId}/interactions`, interaction)
	}

	updateInteraction(interaction: InteractionPayload, relationshipId: string): Observable<void> {
		return this.http.put<void>(`${this.baseUrl}/relationships/${relationshipId}/interactions/${interaction._id}`, interaction)
	}

	deleteInteraction(interactionId: string, relationshipId: string): Observable<true> {
		return this.http.delete<null>(`${this.baseUrl}/relationships/${relationshipId}/interactions/${interactionId}`).pipe(
			map(() => true)
		)
	}

}
