import 'azure-devops-ui/Core/Observable';
import {
  type IObservableArray,
  type IReadonlyObservableArray,
  type IReadonlyObservableValue,
  useObservable,
  useObservableArray,
  // biome-ignore lint/correctness/noUnusedImports: we are augmenting the module
  useSubscription,
} from 'azure-devops-ui/Core/Observable';
import { type DependencyList, useCallback } from 'react';

declare module 'azure-devops-ui/Core/Observable' {
  export function useSubscription<T>(
    sourceObservable: IReadonlyObservableValue<T>,
    callbackFn: (value: T) => void,
    callbackDependencies?: DependencyList,
  ): void;

  export function useSubscription<T>(
    sourceObservable: IReadonlyObservableArray<T>,
    callbackFn: (value: T[]) => void,
    callbackDependencies?: DependencyList,
  ): void;

  export function useDerivedObservable<TSource, T>(
    sourceObservable: IReadonlyObservableValue<TSource>,
    getDerivedValue: (source: TSource) => T,
    callbackDependencies: DependencyList,
  ): IObservableValue<T>;
}

function useDerivedObservableArray<T>(
  sourceObservable: IReadonlyObservableArray<T>,
): IObservableArray<T>;

function useDerivedObservableArray<TSource, T>(
  sourceObservable: IReadonlyObservableArray<TSource>,
  getDerivedValue: (src: TSource[]) => T[],
  callbackDependencies: DependencyList,
): IObservableArray<T>;

function useDerivedObservableArray<TSource, T = TSource>(
  sourceObservable: IReadonlyObservableArray<TSource>,
  getDerivedValue: (source: TSource[]) => T[] = (source) =>
    source as unknown as T[],
  callbackDependencies: DependencyList = [sourceObservable],
): IObservableArray<T> {
  const getDerivedValueCallback = useCallback(
    getDerivedValue,
    // biome-ignore lint/correctness/useExhaustiveDependencies: we want to control when this is updated via callbackDependencies
    callbackDependencies,
  );

  const [observable] = useObservableArray(() =>
    getDerivedValueCallback(sourceObservable.value),
  );

  useSubscription(
    sourceObservable,
    (newValue) => {
      const derivedValue = getDerivedValueCallback(newValue);
      observable.splice(0, observable.length, ...derivedValue);
    },
    [getDerivedValueCallback],
  );

  return observable;
}

export function useDerivedObservable<TSource, T>(
  sourceObservable: IReadonlyObservableArray<TSource>,
  getDerivedValue: (source: TSource[]) => T,
  callbackDependencies: DependencyList = [sourceObservable],
): IReadonlyObservableValue<T> {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const getDerivedValueCallback = useCallback(
    getDerivedValue,
    // biome-ignore lint/correctness/useExhaustiveDependencies: we want to control when this is updated via callbackDependencies
    callbackDependencies,
  );

  const [observable] = useObservable(() =>
    getDerivedValueCallback(sourceObservable.value),
  );

  useSubscription(
    sourceObservable,
    (newValue) => {
      const derivedValue = getDerivedValueCallback(newValue);
      observable.value = derivedValue;
    },
    [getDerivedValueCallback],
  );

  return observable;
}

export { useDerivedObservableArray };
