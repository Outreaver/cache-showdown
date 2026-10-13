using Microsoft.Net.Http.Headers;

app.MapGet("/api/products/{id}", async (int id, HttpContext ctx, AppDb db) =>
{
    // 1. Find out the CURRENT version cheaply, without loading the whole thing
    //    (e.g. an int Version column, a SQL Server rowversion, or UpdatedAt)
    var version = await db.Products
        .Where(p => p.Id == id)
        .Select(p => (int?)p.Version)
        .FirstOrDefaultAsync();
    if (version is null) return Results.NotFound();

    var etag = new EntityTagHeaderValue($"\"{version}\"");

    // Send these on BOTH the 200 and the 304
    ctx.Response.Headers.CacheControl = "no-cache";
    ctx.Response.GetTypedHeaders().ETag = etag;

    // 2. THE CHECK: does the browser already have this version?
    var ifNoneMatch = ctx.Request.GetTypedHeaders().IfNoneMatch;
    if (ifNoneMatch.Any(tag => tag.Equals(EntityTagHeaderValue.Any)
                            || tag.Compare(etag, useStrongComparison: false)))
    {
        return Results.StatusCode(StatusCodes.Status304NotModified); // no body
    }

    // 3. First visit, or the data changed: load and send the full body
    var product = await db.Products.FindAsync(id);
    return Results.Ok(product);
});
