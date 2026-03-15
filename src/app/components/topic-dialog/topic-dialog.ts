import { Component, ElementRef, inject, OnInit, signal, viewChild } from '@angular/core'
import { ReactiveFormsModule } from '@angular/forms'
import { throttleTime } from 'rxjs'

import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef } from '@angular/material/dialog'
import { MatButtonModule } from '@angular/material/button'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatSnackBar } from '@angular/material/snack-bar'

import { InteractionFormGroup } from '../../interfaces/interaction-interface'
import { InteractionMapper } from '../../services/mappers/interaction-mapper'
import { PageHeaderBar } from '../page-header-bar/page-header-bar'
import { REQUIRED_ERROR } from '../../constants/misc-constants'

export interface TopicDialogData {
	interactionForm: InteractionFormGroup
	editTopicIndex?: number
}

@Component({
	selector: 'app-topic-dialog',
	imports: [
		MatButtonModule, MatDialogContent, MatDialogActions, MatDialogClose, MatFormFieldModule,
		MatInputModule, PageHeaderBar, ReactiveFormsModule,
	],
	templateUrl: './topic-dialog.html',
	styleUrl: './topic-dialog.scss'
})
export class TopicDialog implements OnInit {
	readonly data = inject<TopicDialogData>(MAT_DIALOG_DATA)
	private readonly dialogRef = inject(MatDialogRef)
	private readonly interactionMapper = inject(InteractionMapper)
	private readonly snackBar = inject(MatSnackBar)

	private readonly topicNameInput = viewChild<ElementRef<HTMLInputElement>>('topicNameInput')

	protected form = this.interactionMapper.mapTopicModelToForm()
	protected readonly pageHeading = signal('')
	protected readonly wasTopicModified = signal(false)

	private readonly REQUIRED_ERROR = REQUIRED_ERROR

	/** Initialize the dialog heading and form state for adding or editing a topic. */
	ngOnInit(): void {
		if (this.data.editTopicIndex !== undefined) {
			this.pageHeading.set('Edit Topic')
			const targetTopicForm = this.data.interactionForm.controls.topics.controls.at(this.data.editTopicIndex)
			const targetTopic = this.interactionMapper.mapTopicFormToModel(targetTopicForm!)
			this.form = this.interactionMapper.mapTopicModelToForm(targetTopic)
		} else {
			this.pageHeading.set('Add Topic')
		}

		// keep track of unsaved edits so the correct buttons are displayed
		this.markTopicModifiedWhenFormChanges()
	}

	/** Track whether the topic form has unsaved edits. */
	private markTopicModifiedWhenFormChanges(): void {
		this.form.valueChanges.pipe(
			throttleTime(500),
		).subscribe(() => this.wasTopicModified.set(true))
	}

	/** Clear the topic name input and return focus to it. */
	protected clearTopicName(): void {
		this.form.reset()
		this.topicNameInput()?.nativeElement.focus()
	}

	/** Validate the topic form and write it back to the parent interaction form. */
	protected saveTopic(): void {
		if (this.form.invalid) {
			this.snackBar.open(this.REQUIRED_ERROR, undefined)
			return
		}
		if (this.data.editTopicIndex !== undefined) this.data.interactionForm.controls.topics.setControl(this.data.editTopicIndex!, this.form)
		else this.data.interactionForm.controls.topics.push(this.form)
		this.form = this.interactionMapper.mapTopicModelToForm()
		this.dialogRef.close()
	}

}
