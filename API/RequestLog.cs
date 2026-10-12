using System.Collections.Concurrent;

namespace API;

/// <summary>One request that actually reached the server (cache hits never show up here).</summary>
public sealed record LogEntry(
    int RequestNumber,
    DateTimeOffset Time,
    string Path,
    int Status,
    Dictionary<string, string> RequestHeaders,
    Dictionary<string, string> ResponseHeaders,
    string Note);

/// <summary>Headers the playground endpoint should send, chosen by the user.</summary>
public sealed record PlaygroundConfig(
    string? CacheControl,
    bool ETag,
    bool LastModified,
    int? ExpiresInSeconds,
    string? Vary);

/// <summary>Everything the server remembers about one learner's session.</summary>
public sealed class SessionState
{
    private const int MaxEntries = 200;

    private readonly Lock _lock = new();
    private readonly List<LogEntry> _entries = [];
    private int _counter;

    public SessionState()
    {
        LastModified = TruncateToSeconds(DateTimeOffset.UtcNow);
    }

    /// <summary>Version of the demo resource; bumped by "change resource on server".</summary>
    public int Version { get; private set; } = 1;

    /// <summary>When the demo resource last changed (HTTP dates only have 1-second precision).</summary>
    public DateTimeOffset LastModified { get; private set; }

    public PlaygroundConfig Playground { get; set; } = new("max-age=10", true, false, null, null);

    public string ETag => $"\"v{Version}\"";

    public int NextRequestNumber()
    {
        lock (_lock) return ++_counter;
    }

    public void ChangeResource()
    {
        lock (_lock)
        {
            Version++;
            LastModified = TruncateToSeconds(DateTimeOffset.UtcNow);
        }
    }

    public void Add(LogEntry entry)
    {
        lock (_lock)
        {
            _entries.Add(entry);
            if (_entries.Count > MaxEntries) _entries.RemoveAt(0);
        }
    }

    public LogEntry[] Snapshot()
    {
        lock (_lock) return [.. _entries];
    }

    private static DateTimeOffset TruncateToSeconds(DateTimeOffset value) =>
        new(value.Ticks - value.Ticks % TimeSpan.TicksPerSecond, value.Offset);
}

/// <summary>In-memory store of sessions. Good enough for a local learning tool.</summary>
public sealed class RequestLog
{
    private readonly ConcurrentDictionary<string, SessionState> _sessions = new();

    public SessionState Get(string session) => _sessions.GetOrAdd(session, _ => new SessionState());

    public void Remove(string session) => _sessions.TryRemove(session, out _);
}
