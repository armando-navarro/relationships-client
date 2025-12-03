import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { MatButtonModule } from '@angular/material/button'

import { PageHeaderBarComponent } from '../../components/page-header-bar/page-header-bar.component'

@Component({
	selector: 'app-page-not-found',
	standalone: true,
	imports: [MatButtonModule, PageHeaderBarComponent, RouterLink],
	templateUrl: './page-not-found.component.html',
	styleUrl: './page-not-found.component.scss'
})
export class PageNotFoundComponent {

}
