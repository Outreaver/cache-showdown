namespace API;

/// <summary>Which caching headers a demo response carries.</summary>
public sealed record ScenarioConfig(
    string? CacheControl = null,
    int? ExpiresInSeconds = null,
    bool UseETag = false,
    bool UseLastModified = false,
    string? Vary = null);

public static class Scenarios
{
    public static readonly IReadOnlyDictionary<string, ScenarioConfig> All = new Dictionary<string, ScenarioConfig>
    {
        // Lesson: no caching headers at all -> the browser has nothing to work with.
        ["no-headers"] = new(),

        // Lesson: freshness. Reuse without asking for 10 seconds.
        ["max-age"] = new(CacheControl: "max-age=10"),

        // Lesson: the old way of saying the same thing, with an absolute date.
        ["expires"] = new(ExpiresInSeconds: 10),

        // Lesson: when both are present, max-age wins (stale after 5s, not 60s).
        ["expires-and-max-age"] = new(CacheControl: "max-age=5", ExpiresInSeconds: 60),

        // Lesson: validation with ETag / If-None-Match.
        ["etag"] = new(CacheControl: "max-age=5", UseETag: true),

        // Lesson: validation with Last-Modified / If-Modified-Since.
        ["last-modified"] = new(CacheControl: "max-age=5", UseLastModified: true),

        // Lesson: store it, but always ask first.
        ["no-cache"] = new(CacheControl: "no-cache", UseETag: true),

        // Lesson: never store it.
        ["no-store"] = new(CacheControl: "no-store", UseETag: true),

        // Lesson: serve stale instantly, refresh in the background.
        ["swr"] = new(CacheControl: "max-age=5, stale-while-revalidate=20"),

        // Lesson: one URL, several versions depending on a request header.
        ["vary"] = new(CacheControl: "max-age=30", Vary: "Accept-Language"),
        ["vary-missing"] = new(CacheControl: "max-age=30"),
    };

    public static ScenarioConfig FromPlayground(PlaygroundConfig config) => new(
        CacheControl: string.IsNullOrWhiteSpace(config.CacheControl) ? null : config.CacheControl.Trim(),
        ExpiresInSeconds: config.ExpiresInSeconds,
        UseETag: config.ETag,
        UseLastModified: config.LastModified,
        Vary: string.IsNullOrWhiteSpace(config.Vary) ? null : config.Vary.Trim());
}
