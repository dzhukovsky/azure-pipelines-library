import { ObservableArray } from 'azure-devops-ui/Core/Observable';
import type { ObservableObject } from './ObservableObject';

export class ObservableObjectArray<
  TItem extends ObservableObject<TItem>,
> extends ObservableArray<TItem> {
  private _modified = false;

  readonly initialItems: readonly TItem[];
  private readonly _currentItems = new Set<TItem>();

  constructor(items?: TItem[]) {
    super(items);

    this.initialItems = items ? [...items] : [];

    this.initialItems.forEach((item) => {
      this._currentItems.add(item);
      item.subscribe(this.onItemModified);
    });

    this.subscribe((e) => {
      e.addedItems?.forEach((item) => {
        this._currentItems.add(item);
        item.subscribe(this.onItemModified);
      });

      e.removedItems?.forEach((item) => {
        this._currentItems.delete(item);
        item.unsubscribe(this.onItemModified);
      });

      this.recomputeModified();
    });

    this.recomputeModified();
  }

  get modified() {
    return this._modified;
  }

  private set modified(value: boolean) {
    if (this._modified !== value) {
      this._modified = value;
      // ObservableArray actions are a fixed set, so a dirty-flag flip reuses
      // 'change' and carries no addedItems/removedItems. Subscribers that only
      // care about membership must gate on those, not on the action alone.
      this.notify({ index: 0 }, 'change');
    }
  }

  private recomputeModified() {
    this.modified =
      this._currentItems.size !== this.initialItems.length ||
      this.initialItems.some(
        (item) => !this._currentItems.has(item) || item.modified,
      );
  }

  private onItemModified = () => {
    this.recomputeModified();
  };
}
