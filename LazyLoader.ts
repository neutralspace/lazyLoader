import { ObserverOpts, LazyLoaderOpts, ObserverCallback } from './types';

const TARGET_QUERY: string = '.lazy-load';

const DEFAULT_OPTS: ObserverOpts = {
  root: null,
  rootMargin: '400px 0px',
  threshold: 0.0,
};

/**
 * Class representing a lazy image loader.
 * Uses Intersection and Mutation browser`s api.
 */
export default class LazyLoader {
  private readonly observer: IntersectionObserver;
  private readonly options: ObserverOpts = {};
  private readonly callback: ObserverCallback;
  private readonly targetQuery: string = TARGET_QUERY;
  private readonly targetClassName = TARGET_QUERY.slice(1);

  constructor(opts?: LazyLoaderOpts) {
    this.setOptions(opts);

    if ('IntersectionObserver' in window) {
      this.init();
    } else {
      this.loadAllImages();
    }
  }

  /**
   * Start observer process for a given list of DOM nodes.
   * @param targetsList {NodeListOf<Element>} - List of DOM nodes.
   */
  startObserve(targetsList: NodeListOf<Element>): void {
    targetsList.forEach((target) => {
      this.observer.observe(target);
    });
  }

  /**
   * Stop intersection observer.
   */
  stopObserve(): void {
    this.observer.disconnect();
  }

  /**
   * Initialize intersection observer and start watching for DOM changes.
   */
  private init(): void {
    this.observer = new IntersectionObserver(this.processEntries, this.options);

    document.addEventListener('DOMContentLoaded', () => {
      const targetsList = this.getTargetNodes(document);

      this.startObserve(targetsList);
      this.watchForDOMChanges();
    });
  }

  /**
   * Define observer`s options based on given user`s options and
   * default values.
   * @param targetQuery {string} - Query for a target element.
   * @param userOpts {LazyLoaderOpts} - Object with observer options.
   */
  private setOptions(userOpts: LazyLoaderOpts = {}): void {
    const { callback, ...optsFromUser } = userOpts;

    this.options = { ...DEFAULT_OPTS, ...optsFromUser };
    this.callback = callback || this.loadImage;
  }

  /**
   * Start process of watching DOM changes. If any target element has been added,
   * start observer process for this element.
   */
  private watchForDOMChanges(): void {
    const domObserver = new MutationObserver((mutations) => {
      mutations.forEach(({ addedNodes }) => {
        addedNodes.forEach((node) => {

          if (node.nodeType === Node.ELEMENT_NODE) {
            const targetNodes: NodeListOf<Element> = this.getTargetNodes(node);

            if (targetNodes.length > 0) {
              this.startObserve(targetNodes);
            }
          }
        });
      });
    });

    domObserver.observe(document.body, { childList: true, subtree: true });
  }

  /**
   * Get list of nodes/elements by a target query.
   * @param rootNode {Element | Node} - Search of elements
   * would be performed inside this node.
   * @returns {NodeListOf<Element>} - List of found elements.
   */
  private getTargetNodes(rootNode: Element | Node): NodeListOf<Element> {
    return (<Element>rootNode).querySelectorAll(this.targetQuery);
  }

  /**
   * Process every intersected entry. Apply a callback
   * if entry was intersected.
   * @param entries {IntersectionObserverEntry[]} - Array of intersected elements.
   * @param observer {IntersectionObserver} - Intersection observer.
   */
  private processEntries = (entries: IntersectionObserverEntry[], observer: IntersectionObserver): void => {
    entries.forEach((entry) => {
      if (entry.intersectionRatio > 0) {
        this.callback(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }

  /**
   * Load actual image for a given target. Presents observer`s callback
   * by default.
   * @param target {Element} - Target image.
   */
  private loadImage(target: Element): void {
    if (target) {
      const newImgSrc: string = target.getAttribute('data-src');

      target.setAttribute('src', newImgSrc);
      target.classList.remove(this.targetClassName);
    }
  }

  /**
   * Load all images at once. Could be used
   * if intersection api is not provided.
   */
  private loadAllImages(): void {
    window.addEventListener('load', () => {
      const targetsList = Array.from(this.getTargetNodes(document));

      targetsList.forEach((target) => {
        this.loadImage(target);
      });
    });
  }
}
