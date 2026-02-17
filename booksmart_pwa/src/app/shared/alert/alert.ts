import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert.html',
  styleUrl: './alert.scss'
})
export class Alert {
  @Input() message: string = '';
  @Input() type: 'error' | 'success' | 'info' | 'warning' = 'info';
  @Input() show: boolean = false;
}