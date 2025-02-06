import { useEffect } from 'react';

export const measurePageLoad = () => {
  const timing = window.performance.timing;
  const loadTime = timing.loadEventEnd - timing.navigationStart;
  return loadTime;
};

export const measureApiResponse = async (url: string, options?: RequestInit) => {
  const start = performance.now();
  const response = await fetch(url, options);
  const end = performance.now();
  const duration = end - start;
  
  if (duration > 500) {
    console.warn(`API call to ${url} took ${duration}ms, exceeding 500ms threshold`);
  }
  
  return { response, duration };
};

export const usePerformanceMonitoring = () => {
  useEffect(() => {
    // Monitor page load time
    window.addEventListener('load', () => {
      const loadTime = measurePageLoad();
      if (loadTime > 1000) {
        console.warn(`Page load time exceeded 1 second: ${loadTime}ms`);
      }
    });

    // Monitor input responsiveness
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 100) {
          console.warn(`Input latency exceeded 100ms: ${entry.duration}ms`);
        }
      }
    });

    observer.observe({ entryTypes: ['first-input', 'event'] });

    return () => {
      observer.disconnect();
    };
  }, []);
};
