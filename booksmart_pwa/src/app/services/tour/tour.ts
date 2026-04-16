import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';

export interface TourStep {
  selector: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  route?: string;
  clickBefore?: string;
  delay?: number;
}

@Injectable({ providedIn: 'root' })
export class TourService {
  private steps: TourStep[] = [];
  private currentStepIndex = -1;
  private overlayElement: HTMLElement | null = null;
  private tooltipElement: HTMLElement | null = null;
  private highlightElement: HTMLElement | null = null;
  private isActive = false;
  private keyHandler: ((e: KeyboardEvent) => void) | null = null;

  tourEnd$ = new Subject<void>();

  constructor(private router: Router) {}

  startTour(steps: TourStep[]): void {
    if (this.isActive) this.endTour();
    this.steps = steps;
    this.currentStepIndex = -1;
    this.isActive = true;
    this.createOverlay();
    this.bindEvents();
    this.nextStep();
  }

  async nextStep(): Promise<void> {
    this.currentStepIndex++;
    if (this.currentStepIndex >= this.steps.length) {
      this.endTour();
      return;
    }
    await this.showStep(this.currentStepIndex);
  }

  async prevStep(): Promise<void> {
    if (this.currentStepIndex <= 0) return;
    this.currentStepIndex--;
    await this.showStep(this.currentStepIndex);
  }

  endTour(): void {
    this.isActive = false;
    this.currentStepIndex = -1;
    this.steps = [];
    this.removeOverlay();
    this.unbindEvents();
    this.tourEnd$.next();
  }

  get active(): boolean { return this.isActive; }
  get stepIndex(): number { return this.currentStepIndex; }
  get totalSteps(): number { return this.steps.length; }

  private async showStep(index: number): Promise<void> {
    const step = this.steps[index];
    if (!step) return;

    if (step.route) {
      await this.router.navigateByUrl(step.route);
      await this.wait(500);
    }

    if (step.clickBefore) {
      const btn = document.querySelector(step.clickBefore) as HTMLElement;
      if (btn) {
        btn.click();
        await this.wait(step.delay || 400);
      }
    } else if (step.delay) {
      await this.wait(step.delay);
    }

    const target = document.querySelector(step.selector) as HTMLElement;
    if (!target) {
      console.warn(`[Tour] Element not found: ${step.selector}`);
      this.nextStep();
      return;
    }

    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await this.wait(600);

    this.positionHighlight(target);
    this.positionTooltip(target, step, true);
  }

  private createOverlay(): void {
    this.overlayElement = document.createElement('div');
    this.overlayElement.className = 'tour-overlay';
    this.overlayElement.addEventListener('click', () => this.endTour());
    document.body.appendChild(this.overlayElement);

    this.highlightElement = document.createElement('div');
    this.highlightElement.className = 'tour-highlight';
    document.body.appendChild(this.highlightElement);

    this.tooltipElement = document.createElement('div');
    this.tooltipElement.className = 'tour-tooltip';
    document.body.appendChild(this.tooltipElement);
  }

  private removeOverlay(): void {
    this.overlayElement?.remove();
    this.tooltipElement?.remove();
    this.highlightElement?.remove();
    this.overlayElement = this.tooltipElement = this.highlightElement = null;
  }

  private bindEvents(): void {
    this.keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') this.endTour();
      if (e.key === 'ArrowRight' || e.key === 'Enter') this.nextStep();
      if (e.key === 'ArrowLeft') this.prevStep();
    };
    document.addEventListener('keydown', this.keyHandler);
    window.addEventListener('resize', this.repositionCurrent);
    window.addEventListener('scroll', this.repositionCurrent, true);
  }

  private unbindEvents(): void {
    if (this.keyHandler) document.removeEventListener('keydown', this.keyHandler);
    window.removeEventListener('resize', this.repositionCurrent);
    window.removeEventListener('scroll', this.repositionCurrent, true);
    this.keyHandler = null;
  }

  private repositionCurrent = () => {
    if (!this.isActive || this.currentStepIndex < 0) return;
    const step = this.steps[this.currentStepIndex];
    const target = document.querySelector(step.selector) as HTMLElement;
    if (target) {
      this.positionHighlight(target);
      this.positionTooltip(target, step, false);
    }
  };

  private positionHighlight(target: HTMLElement): void {
    if (!this.highlightElement) return;
    const rect = target.getBoundingClientRect();
    const pad = 8;
    this.highlightElement.style.top = `${rect.top - pad}px`;
    this.highlightElement.style.left = `${rect.left - pad}px`;
    this.highlightElement.style.width = `${rect.width + pad * 2}px`;
    this.highlightElement.style.height = `${rect.height + pad * 2}px`;
    this.highlightElement.style.opacity = '1';
  }

  private positionTooltip(target: HTMLElement, step: TourStep, updateContent = true): void {
    if (!this.tooltipElement) return;

    if (updateContent) {
      const stepNum = this.currentStepIndex + 1;
      const total = this.steps.length;
      this.tooltipElement.innerHTML = `
        <div class="tour-tooltip-header">
          <span class="tour-tooltip-step">${stepNum} / ${total}</span>
          <button class="tour-tooltip-close" aria-label="Cerrar tour">✕</button>
        </div>
        <h3 class="tour-tooltip-title">${step.title}</h3>
        <p class="tour-tooltip-desc">${step.description}</p>
        <div class="tour-tooltip-progress">
          <div class="tour-tooltip-progress-bar" style="width: ${(stepNum / total) * 100}%"></div>
        </div>
        <div class="tour-tooltip-actions">
          <button class="tour-btn tour-btn-skip">Salir del tour</button>
          <div class="tour-btn-group">
            ${stepNum > 1 ? '<button class="tour-btn tour-btn-prev">← Anterior</button>' : ''}
            <button class="tour-btn tour-btn-next">${stepNum === total ? 'Finalizar ✓' : 'Siguiente →'}</button>
          </div>
        </div>
      `;
      this.tooltipElement.querySelector('.tour-tooltip-close')?.addEventListener('click', () => this.endTour());
      this.tooltipElement.querySelector('.tour-btn-skip')?.addEventListener('click', () => this.endTour());
      this.tooltipElement.querySelector('.tour-btn-next')?.addEventListener('click', () => this.nextStep());
      this.tooltipElement.querySelector('.tour-btn-prev')?.addEventListener('click', () => this.prevStep());
    }

    const rect = target.getBoundingClientRect();
    const tooltipWidth = Math.min(360, window.innerWidth - 32);
    const tooltipHeight = this.tooltipElement.offsetHeight || 220;
    const gap = 16;
    let top = 0;
    let left = 0;
    let finalPosition = step.position;

    if (step.position === 'top' && rect.top < tooltipHeight + gap) finalPosition = 'bottom';
    else if (step.position === 'bottom' && (window.innerHeight - rect.bottom) < tooltipHeight + gap) finalPosition = 'top';

    switch (finalPosition) {
      case 'bottom':
        top = rect.bottom + gap;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'top':
        top = rect.top - tooltipHeight - gap;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - gap;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + gap;
        break;
    }

    left = Math.max(12, Math.min(left, window.innerWidth - tooltipWidth - 12));

    if (top < 12) {
      top = (finalPosition === 'top') ? rect.bottom + gap : 12;
    } else if (top + tooltipHeight > window.innerHeight - 12) {
      top = (finalPosition === 'bottom') ? rect.top - tooltipHeight - gap : window.innerHeight - tooltipHeight - 12;
    }

    this.tooltipElement.style.width = `${tooltipWidth}px`;
    this.tooltipElement.style.top = `${top}px`;
    this.tooltipElement.style.left = `${left}px`;
    this.tooltipElement.setAttribute('data-position', finalPosition);
    this.tooltipElement.style.opacity = '1';
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
