using API;
using Microsoft.Net.Http.Headers;

var builder = WebApplication.CreateBuilder(args);

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddSingleton<RequestLog>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// No HTTPS redirection: the frontend talks to us over http://localhost through the Vite proxy.
// (On Azure App Service, HTTPS is enforced by the platform: see deploy.sh.)

// Production: the prerendered frontend (app/dist/client, copied to wwwroot by deploy.sh) is served from here too,
// so the whole app is one origin and /api needs no proxy. In development wwwroot is empty and Vite serves the UI.
// /lessons/etag → /lessons/etag/index.html, without redirecting to a trailing slash.
app.UseDefaultFiles(new DefaultFilesOptions { RedirectToAppendTrailingSlash = false });
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        // Vite puts a content hash in every asset file name, so a changed file always gets a new URL.
        if (ctx.Context.Request.Path.StartsWithSegments("/assets"))
            ctx.Context.Response.Headers[HeaderNames.CacheControl] = "public, max-age=31536000, immutable";
    },
});

// Route only after the static files: otherwise routing runs first, the fallback below claims every page URL,
// and UseDefaultFiles/UseStaticFiles step aside, so each page gets _shell.html instead of its prerendered HTML.
app.UseRouting();

app.MapDemoEndpoints();

// Any other URL gets the client-only shell, which renders the app's own 404 page.
app.MapFallbackToFile("_shell.html");

app.Run();
