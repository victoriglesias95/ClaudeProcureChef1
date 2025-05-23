// Performance monitoring utilities
export const measurePageLoad = () => {
  if (typeof window === 'undefined') return;
  
  window.addEventListener('load', () => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (navigation) {
      const metrics = {
        'DNS Lookup': `${(navigation.domainLookupEnd - navigation.domainLookupStart).toFixed(2)}ms`,
        'TCP Connection': `${(navigation.connectEnd - navigation.connectStart).toFixed(2)}ms`,
        'Request Time': `${(navigation.responseStart - navigation.requestStart).toFixed(2)}ms`,
        'Response Time': `${(navigation.responseEnd - navigation.responseStart).toFixed(2)}ms`,
        'DOM Processing': `${(navigation.domComplete - navigation.domLoading).toFixed(2)}ms`,
        'Total Load Time': `${(navigation.loadEventEnd - navigation.fetchStart).toFixed(2)}ms`,
      };
      
      console.table(metrics);
      
      // Send to monitoring service if needed
      if (window.Sentry) {
        window.Sentry.addBreadcrumb({
          category: 'performance',
          message: 'Page Load Metrics',
          level: 'info',
          data: metrics,
        });
      }
    }
  });
};

// Measure React component render time
export const measureComponentPerformance = (componentName: string) => {
  const startTime = performance.now();
  
  return () => {
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} render time: ${renderTime.toFixed(2)}ms`);
    }
    
    // Log slow renders
    if (renderTime > 16) { // More than one frame (60fps)
      console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
    }
  };
};

// Web Vitals tracking
export const reportWebVitals = (metric: any) => {
  if (window.Sentry) {
    window.Sentry.addBreadcrumb({
      category: 'web-vitals',
      message: metric.name,
      level: 'info',
      data: {
        value: metric.value,
        rating: metric.rating,
      },
    });
  }
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(metric);
  }
};