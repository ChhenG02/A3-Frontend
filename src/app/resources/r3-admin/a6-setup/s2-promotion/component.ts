// ================================================================================>> Core Library
import { Component, OnInit } from '@angular/core';

// ================================================================================>> Third Party Library
// Material
import { MatIconModule } from '@angular/material/icon';


@Component({
    selector    : 'promotions',
    standalone  : true,
    templateUrl : './template.html',
    styleUrl    : './style.scss',
    imports     : [
        MatIconModule
    ]
})

export class promotionComponent implements OnInit {

    constructor( ) { }

    ngOnInit(): void {}
}
