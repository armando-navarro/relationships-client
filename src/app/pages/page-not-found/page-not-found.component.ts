import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { MatButtonModule } from '@angular/material/button'

@Component({
	selector: 'app-page-not-found',
	imports: [MatButtonModule, RouterLink],
	templateUrl: './page-not-found.component.html',
	styleUrl: './page-not-found.component.scss'
})
export class PageNotFoundComponent {

}
