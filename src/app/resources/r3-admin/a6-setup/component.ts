// ================================================================================>> Core Library
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

// ================================================================================>> Third Party Library
// Material
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

// RxJS
import { Subject, takeUntil } from 'rxjs';

// Translation
import { translate, TranslocoModule } from '@ngneat/transloco';

// ================================================================================>> Custom Library
// Helper
import { helperAnimations } from 'helper/animations';
// import { HelperNavigationComponent } from "helper/components/navigation/navigation.component";
import { HelperNavigationComponent, HelperNavigationItem, HelperNavigationService } from 'helper/components/navigation';

// Service
import { HelperMediaWatcherService } from 'helper/services/media-watcher';
import { User } from 'app/core/user/interface';
import { UserService } from 'app/core/user/service';
// import { UserService } from 'app/core/user/user.service';

// // Interface
// import { User } from 'app/core/user/user.types';

@Component({
    selector    : 'setting-layout',
    standalone  : true,
    templateUrl : './template.html',
    styleUrl    : './style.scss',
    animations  : helperAnimations,
    imports     : [
        MatIconModule,
        HelperNavigationComponent,
        RouterOutlet,
        TranslocoModule,
        MatButtonModule,
    ],
})

export class SetupLayoutComponent implements OnInit {

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * @set the navigation data from the core/navigation/navigation.data or we can write it here if you want.
     * */
    public subnavigation: HelperNavigationItem[] = [
        {
            id: 'types',
            title:'Category',
            type: 'basic-sub',
            icon: 'mdi:shape-outline',
            link: 'products/types',
        },

          {
            id: 'promotions',
            title:'Promotions',
            type: 'basic-sub',
            icon: 'mdi:brightness-percent',
            link: 'promotion',
        },

          {
            id: 'stock-status',
            title:'Stock Status',
            type: 'basic-sub',
            icon: 'mdi:list-status',
            link: 'stock-status',
        },
        
    ];

    public user          : User;

    public isLoading     : boolean = false;
    public isScreenSmall : boolean = false;

    constructor(
        private _changeDetectorRef          : ChangeDetectorRef,
        private _service                    : UserService,
        private _helperNavigationService    : HelperNavigationService,
        private _helperMediaWatcherService  : HelperMediaWatcherService,
        
    ) {}

    ngOnInit(): void {

        // Subscribe to media changes
        this._helperMediaWatcherService.onMediaChange$.pipe(takeUntil(this._unsubscribeAll)).subscribe(({ matchingAliases }) => {
            // Check if the screen is small
            this.isScreenSmall = !matchingAliases.includes('md');
        });

        // ===>> Get Data from Global User Service
        this._service.user$.pipe(takeUntil(this._unsubscribeAll)).subscribe((user: User) => {
            // Data Maping
            this.user = user;

            // Mark for check
            this._changeDetectorRef.markForCheck();
        });
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    /**
     * Toggle navigation
     *
     * @param name
     */
    toggleNavigation(name: string): void {
        // Get the navigation
        const navigation =
            this._helperNavigationService.getComponent<HelperNavigationComponent>(
                name
            );

        if (navigation) {
            // Toggle the opened status
            navigation.toggle();
        }
    }
}
