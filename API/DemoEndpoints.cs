using System.Globalization;
using Microsoft.Extensions.Primitives;

namespace API;

public static class DemoEndpoints
{
    /// <summary>Pretend the server is far away, so cache hits visibly feel faster.</summary>
    private static readonly TimeSpan SimulatedLatency = TimeSpan.FromMilliseconds(300);

    private static readonly string[] LoggedRequestHeaders =
        ["If-None-Match", "If-Modified-Since", "Cache-Control", "Pragma", "Accept-Language"];

    public static void MapDemoEndpoints(this WebApplication app)
    {
        app.MapGet("/api/demo/{scenario}", async (string scenario, string? session, HttpContext ctx, RequestLog log) =>
        {
            if (string.IsNullOrWhiteSpace(session)) return Results.BadRequest("Missing ?session=");
            if (!Scenarios.All.TryGetValue(scenario, out var config)) return Results.NotFound($"Unknown scenario '{scenario}'");

            await Task.Delay(SimulatedLatency);
            return Respond(ctx, log.Get(session), scenario, config);
        });

        app.MapGet("/api/playground", async (string? session, HttpContext ctx, RequestLog log) =>
        {
            if (string.IsNullOrWhiteSpace(session)) return Results.BadRequest("Missing ?session=");

            var state = log.Get(session);
            await Task.Delay(SimulatedLatency);
            return Respond(ctx, state, "playground", Scenarios.FromPlayground(state.Playground));
        });

        var sessionApi = app.MapGroup("/api/session/{session}");

        // Everything below is plumbing for the UI, never cached (and never logged).
        sessionApi.AddEndpointFilter(async (ctx, next) =>
        {
            ctx.HttpContext.Response.Headers.CacheControl = "no-store";
            return await next(ctx);
        });

        sessionApi.MapGet("/log", (string session, RequestLog log) =>
        {
            var state = log.Get(session);
            return Results.Ok(new
            {
                state.Version,
                ETag = state.ETag,
                LastModified = state.LastModified.ToString("R"),
                Entries = state.Snapshot(),
            });
        });

        sessionApi.MapPost("/change-resource", (string session, RequestLog log) =>
        {
            var state = log.Get(session);
            state.ChangeResource();
            return Results.Ok(new { state.Version, ETag = state.ETag, LastModified = state.LastModified.ToString("R") });
        });

        sessionApi.MapGet("/playground", (string session, RequestLog log) => Results.Ok(log.Get(session).Playground));

        sessionApi.MapPut("/playground", (string session, PlaygroundConfig config, RequestLog log) =>
        {
            log.Get(session).Playground = config;
            return Results.Ok(config);
        });

        sessionApi.MapDelete("", (string session, RequestLog log) =>
        {
            log.Remove(session);
            return Results.NoContent();
        });
    }

    private static IResult Respond(HttpContext ctx, SessionState state, string scenario, ScenarioConfig config)
    {
        var request = ctx.Request;
        var number = state.NextRequestNumber();

        var requestHeaders = new Dictionary<string, string>();
        foreach (var name in LoggedRequestHeaders)
        {
            if (request.Headers.TryGetValue(name, out var value)) requestHeaders[name] = value.ToString();
        }

        var responseHeaders = BuildCacheHeaders(state, config);
        foreach (var (name, value) in responseHeaders) ctx.Response.Headers[name] = value;

        var (notModified, note) = EvaluateConditionals(request, state, config);
        var status = notModified ? StatusCodes.Status304NotModified : StatusCodes.Status200OK;

        state.Add(new LogEntry(number, DateTimeOffset.UtcNow, request.Path + request.QueryString, status, requestHeaders, responseHeaders, note));

        if (notModified) return Results.StatusCode(StatusCodes.Status304NotModified);

        var language = PickLanguage(request.Headers.AcceptLanguage);
        return Results.Ok(new
        {
            RequestNumber = number,
            ServerTime = DateTimeOffset.UtcNow,
            state.Version,
            Scenario = scenario,
            Language = language,
            Message = Greeting(language) + $" This is version {state.Version} of the resource.",
        });
    }

    private static Dictionary<string, string> BuildCacheHeaders(SessionState state, ScenarioConfig config)
    {
        var headers = new Dictionary<string, string>();
        if (config.CacheControl is not null) headers["Cache-Control"] = config.CacheControl;
        if (config.ExpiresInSeconds is { } seconds) headers["Expires"] = DateTimeOffset.UtcNow.AddSeconds(seconds).ToString("R");
        if (config.UseETag) headers["ETag"] = state.ETag;
        if (config.UseLastModified) headers["Last-Modified"] = state.LastModified.ToString("R");
        if (config.Vary is not null) headers["Vary"] = config.Vary;
        return headers;
    }

    /// <summary>Decides between "304 Not Modified" and a full "200 OK", explaining why in plain words.</summary>
    private static (bool NotModified, string Note) EvaluateConditionals(HttpRequest request, SessionState state, ScenarioConfig config)
    {
        var ifNoneMatch = request.Headers.IfNoneMatch.ToString();
        var ifModifiedSince = request.Headers.IfModifiedSince.ToString();

        // If-None-Match wins over If-Modified-Since (RFC 9110 §13.1.3).
        if (!string.IsNullOrEmpty(ifNoneMatch))
        {
            if (!config.UseETag) return (false, "Browser sent If-None-Match, but this resource has no ETag now, so the full body is sent.");

            var matches = ifNoneMatch.Split(',')
                .Select(tag => tag.Trim())
                .Any(tag => tag == "*" || tag == state.ETag || tag == "W/" + state.ETag);

            return matches
                ? (true, $"If-None-Match {ifNoneMatch} matches the current ETag {state.ETag}: nothing changed, so 304 with no body.")
                : (false, $"If-None-Match {ifNoneMatch} does not match the current ETag {state.ETag}: the resource changed, so the full new body is sent.");
        }

        if (!string.IsNullOrEmpty(ifModifiedSince))
        {
            if (!config.UseLastModified) return (false, "Browser sent If-Modified-Since, but this resource has no Last-Modified now, so the full body is sent.");

            if (DateTimeOffset.TryParseExact(ifModifiedSince, "R", CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out var since)
                && state.LastModified <= since)
            {
                return (true, $"Not modified since {ifModifiedSince} (last change: {state.LastModified:R}), so 304 with no body.");
            }

            return (false, $"Modified after {ifModifiedSince} (last change: {state.LastModified:R}), so the full new body is sent.");
        }

        return (false, "No conditional headers: the browser had no usable copy, so the full body is sent.");
    }

    private static string PickLanguage(StringValues acceptLanguage)
    {
        var first = acceptLanguage.ToString().Split(',').FirstOrDefault()?.Trim().ToLowerInvariant() ?? "";
        return first.StartsWith("pl") ? "pl" : first.StartsWith("de") ? "de" : "en";
    }

    private static string Greeting(string language) => language switch
    {
        "pl" => "Cześć!",
        "de" => "Hallo!",
        _ => "Hello!",
    };
}
