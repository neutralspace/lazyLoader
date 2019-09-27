export interface ObserverOpts {
  root?: Element;
  rootMargin?: string;
  threshold?: number;
}

export interface LazyLoaderOpts extends ObserverOpts {
  callback?: ObserverCallback;
}

export type ObserverCallback = (target: Element) => void;
