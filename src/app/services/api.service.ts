import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { map, Observable } from 'rxjs'

import { environment } from '../../environments/environment'
import { InsertedId } from "../interfaces/misc.interface"
import { AddInteractionResponse, Interaction, InteractionPayload, InteractionResponse, InteractionWriteResponse } from "../interfaces/interaction.interface"
import { InteractionMapperService } from './mappers/interaction.mapper.service'
import {
	Relationship,
	RelationshipAddResponse,
	RelationshipDerivedProperties,
	RelationshipGroup,
	RelationshipPayload,
	RelationshipResponse,
	RelationshipsGroupedByStatusResponse,
	RelationshipUpdateResponse,
	UpdatedRelationshipProperties,
} from '../interfaces/relationship.interface'
import { RelationshipMapperService } from './mappers/relationship.mapper.service'

@Injectable({ providedIn: 'root' })
export class ApiService {
	private baseUrl = environment.apiUrl
	private readonly http = inject(HttpClient)
	private readonly interactionMapper = inject(InteractionMapperService)
	private readonly relationshipMapper = inject(RelationshipMapperService)

	//#region Relationship endpoints

	getRelationshipsGroupedByStatus(): Observable<RelationshipGroup[]> {
		return this.http.get<RelationshipsGroupedByStatusResponse>(`${this.baseUrl}/relationships`).pipe(
			map(groupedRelationships => this.relationshipMapper.mapGroupedByStatusResponseToModel(groupedRelationships))
		)
	}

	getRelationship(id: string): Observable<Relationship> {
		return this.http.get<RelationshipResponse>(`${this.baseUrl}/relationships/${id}`).pipe(
			map(relationship => this.relationshipMapper.mapResponseToModel(relationship))
		)
	}

	addRelationship(relationship: RelationshipPayload): Observable<RelationshipAddResponse> {
		return this.http.post<RelationshipAddResponse>(`${this.baseUrl}/relationships`, relationship)
	}


	updateRelationship(relationship: RelationshipPayload): Observable<RelationshipUpdateResponse> {
		relationship.interactions?.forEach(interaction => delete interaction.idOfRelationship)
		return this.http.put<RelationshipUpdateResponse>(`${this.baseUrl}/relationships/${relationship._id}`, relationship)
	}

	deleteRelationship(relationshipId: string): Observable<RelationshipDerivedProperties> {
		return this.http.delete<true>(`${this.baseUrl}/relationships/${relationshipId}`).pipe(
			map(() => ({ lastInteractionDate: null }))
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

	addInteraction(interaction: InteractionPayload, relationshipId: string): Observable<InsertedId&UpdatedRelationshipProperties> {
		return this.http.post<AddInteractionResponse>(`${this.baseUrl}/relationships/${relationshipId}/interactions`, interaction).pipe(
			map(({ insertedId, updatedRelationshipProperties }) => ({
				insertedId,
				updatedRelationshipProperties: this.relationshipMapper.mapPartialResponseToModel(updatedRelationshipProperties)
			})),
		)
	}

	updateInteraction(interaction: InteractionPayload, relationshipId: string): Observable<RelationshipDerivedProperties> {
		return this.http.put<InteractionWriteResponse>(`${this.baseUrl}/relationships/${relationshipId}/interactions/${interaction._id}`, interaction).pipe(
			map(({ updatedRelationshipProperties }) => this.relationshipMapper.mapPartialResponseToModel(updatedRelationshipProperties)),
		)
	}

	deleteInteraction(interactionId: string, relationshipId: string): Observable<RelationshipDerivedProperties> {
		return this.http.delete<InteractionWriteResponse>(`${this.baseUrl}/relationships/${relationshipId}/interactions/${interactionId}`).pipe(
			map(response => this.relationshipMapper.mapPartialResponseToModel(response.updatedRelationshipProperties))
		)
	}

}
