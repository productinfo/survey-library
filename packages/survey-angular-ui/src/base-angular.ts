import { ChangeDetectorRef, Component, DoCheck, OnChanges, OnDestroy, SimpleChange, ViewContainerRef } from "@angular/core";
import { ArrayChanges, Base, ISurvey, SurveyModel } from "survey-core";
import { EmbeddedViewContentComponent } from "./embedded-view-content.component";

@Component({
  template: ""
  })
export abstract class BaseAngular<T extends Base = Base> extends EmbeddedViewContentComponent implements DoCheck, OnDestroy {
  constructor(protected changeDetectorRef: ChangeDetectorRef, viewContainerRef?: ViewContainerRef) {
    super(viewContainerRef);
  }
  protected get surveyModel(): ISurvey {
    return this.getModel().getSurvey();
  }
  protected abstract getModel(): T;
  protected previousModel?: T;
  private isModelSubsribed: boolean = false;

  public ngDoCheck(): void {
    if(this.previousModel !== this.getModel()) {
      this.unMakeBaseElementAngular(this.previousModel);
      this.makeBaseElementAngular(this.getModel());
      this.onModelChanged();
      this.previousModel = this.getModel();
    }
    this.setIsRendering(true);
  }

  protected onModelChanged() {}

  private setIsRendering(val: boolean) {
    const model = this.getModel();
    if (!!model) {
      (<any>model).isRendering = val;
    }
  }
  private getIsRendering() {
    const model = this.getModel();
    return !!model && !!(<any>model).isRendering;
  }
  private isDestroyed: boolean = false;
  ngOnDestroy() {
    this.isDestroyed = true;
    this.unMakeBaseElementAngular(this.getModel());
  }

  private makeBaseElementAngular(stateElement: T) {
    if(!!stateElement && !(<any>stateElement).__ngImplemented) {
      this.isModelSubsribed = true;
      (<any>stateElement).__ngImplemented = true;
      stateElement.iteratePropertiesHash((hash, key) => {
        var val: any = hash[key];
        if (Array.isArray(val)) {
          var val: any = val;
          val["onArrayChanged"] = (arrayChanges: ArrayChanges) => {
            this.update(key);
          };
        }
      });
      stateElement.setPropertyValueCoreHandler = (
        hash: any,
        key: string,
        val: any
      ) => {
        if (hash[key] !== val) {
          hash[key] = val;
          this.update(key);
        }
      };
    }
  }
  private unMakeBaseElementAngular(stateElement?: Base) {
    if(!!stateElement && this.isModelSubsribed) {
      this.isModelSubsribed = false;
      (<any>stateElement).__ngImplemented = false;
      stateElement.setPropertyValueCoreHandler = <any>undefined;
      stateElement.iteratePropertiesHash((hash, key) => {
        var val: any = hash[key];
        if (Array.isArray(val)) {
          var val: any = val;
          val["onArrayChanged"] = () => {};
        }
      });
    }
  }

  private update(key: string) {
    if (this.getIsRendering()) return;
    this.beforeUpdate();
    if(this.getPropertiesToUpdateSync().indexOf(key) > -1) {
      this.detectChanges();
      this.afterUpdate();
    } else {
      ((<any>window)["__zone_symbol__queueMicrotask"]
        ? (<any>window)["__zone_symbol__queueMicrotask"] : queueMicrotask)(() => {
        if(!this.isDestroyed) {
          this.detectChanges();
        }
        this.afterUpdate();
      });
    }
  }
  private getChangeDetectorRef() {
    return this.embeddedView ? this.embeddedView : this.changeDetectorRef;
  }
  protected getPropertiesToUpdateSync(): Array<string> {
    return [];
  }
  protected detectChanges() {
    this.getChangeDetectorRef().detectChanges();
  }

  protected beforeUpdate(): void {
    this.getChangeDetectorRef().detach();
    this.setIsRendering(true);
  }
  protected afterUpdate(): void {
    this.getChangeDetectorRef().reattach();
    this.setIsRendering(false);
  }
  ngAfterViewChecked(): void {
    this.setIsRendering(false);
  }
}