import { ObservableArray } from 'azure-devops-ui/Core/Observable';
import type { ObservableObject } from './ObservableObject';

export class ObservableObjectArray<
  TItem extends ObservableObject<TItem>,
> extends ObservableArray<TItem> {
  private _modified = false;

  private readonly _initialItems: readonly TItem[];
  private readonly _currentItems = new Set<TItem>();

  constructor(items?: TItem[]) {
    super(items);

    this._initialItems = items ? [...items] : [];

    this._initialItems.forEach((item) => {
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
      this.notify({ index: 0 }, 'change');
    }
  }

  private recomputeModified() {
    this.modified =
      this._currentItems.size !== this._initialItems.length ||
      this._initialItems.some(
        (item) => !this._currentItems.has(item) || item.modified,
      );
  }

  private onItemModified = () => {
    this.recomputeModified();
  };
}
