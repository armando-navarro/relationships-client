import { MatDialogConfig } from "@angular/material/dialog"
import { MatSnackBarConfig } from "@angular/material/snack-bar"

// verbiage
export const REQUIRED_ERROR = 'Please fill in the required fields.'
export const TOPIC_HINT_VERBIAGE = 'Click on a topic to reveal any notes associated with that topic.'

// Angular Material configs
export const DIALOG_CONFIG: MatDialogConfig = { disableClose: true, maxWidth: 496 }
export const SNACKBAR_CONFIG: MatSnackBarConfig = { duration: 5000, verticalPosition: 'bottom' }
export const SNACKBAR_UNDO_CONFIG: MatSnackBarConfig = { verticalPosition: 'bottom' }
