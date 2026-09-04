type CounterName =
  | "http_requests_total"
  | "successful_redirects_total"
  | "http_404_total"
  | "url_creations_total"
  | "redis_cache_hits_total"
  | "redis_cache_misses_total"
  | "kafka_publish_failures_total"
  | "consumer_processing_failures_total";

type HistogramName =
  | "database_query_duration_ms"
  | "http_request_duration_ms";

type Histogram = {
  count: number;
  sum: number;
};

const counters = new Map<CounterName, number>();
const histograms = new Map<HistogramName, Histogram>();

export function incrementCounter(name: CounterName): void {
  counters.set(name, (counters.get(name) ?? 0) + 1);
}

export function observeHistogram(
  name: HistogramName,
  durationMs: number,
): void {
  const current = histograms.get(name) ?? { count: 0, sum: 0 };
  current.count += 1;
  current.sum += durationMs;
  histograms.set(name, current);
}

export function renderMetrics(): string {
  const lines = [
    "# TYPE http_requests_total counter",
    `http_requests_total ${counters.get("http_requests_total") ?? 0}`,
    "# TYPE successful_redirects_total counter",
    `successful_redirects_total ${counters.get("successful_redirects_total") ?? 0}`,
    "# TYPE http_404_total counter",
    `http_404_total ${counters.get("http_404_total") ?? 0}`,
    "# TYPE url_creations_total counter",
    `url_creations_total ${counters.get("url_creations_total") ?? 0}`,
    "# TYPE redis_cache_hits_total counter",
    `redis_cache_hits_total ${counters.get("redis_cache_hits_total") ?? 0}`,
    "# TYPE redis_cache_misses_total counter",
    `redis_cache_misses_total ${counters.get("redis_cache_misses_total") ?? 0}`,
    "# TYPE kafka_publish_failures_total counter",
    `kafka_publish_failures_total ${counters.get("kafka_publish_failures_total") ?? 0}`,
    "# TYPE consumer_processing_failures_total counter",
    `consumer_processing_failures_total ${counters.get("consumer_processing_failures_total") ?? 0}`,
  ];

  for (const name of [
    "database_query_duration_ms",
    "http_request_duration_ms",
  ] as const) {
    const histogram = histograms.get(name) ?? { count: 0, sum: 0 };
    lines.push(
      `# TYPE ${name} summary`,
      `${name}_count ${histogram.count}`,
      `${name}_sum ${histogram.sum.toFixed(3)}`,
    );
  }

  return `${lines.join("\n")}\n`;
}

export async function observeDatabaseQuery<T>(
  operation: () => Promise<T>,
): Promise<T> {
  const startedAt = performance.now();

  try {
    return await operation();
  } finally {
    observeHistogram(
      "database_query_duration_ms",
      performance.now() - startedAt,
    );
  }
}
