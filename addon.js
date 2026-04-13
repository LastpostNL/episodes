const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");
const fetch = require("node-fetch");

const PORT = process.env.PORT || 7000;

const builder = new addonBuilder({
    id: "org.trakt.calendar",
    version: "1.0.0",
    name: "Trakt Calendar",
    description: "Upcoming episodes from Trakt",
    resources: ["catalog"],
    types: ["series"],
    catalogs: [
        {
            type: "series",
            id: "trakt-calendar",
            name: "Upcoming Episodes"
        }
    ]
});

// 🔑 ENV VARS (nooit hardcoden op GitHub!)
const TRAKT_API_KEY = process.env.TRAKT_API_KEY;
const TRAKT_TOKEN = process.env.TRAKT_TOKEN;

async function getTraktCalendar() {
    const res = await fetch("https://api.trakt.tv/calendars/my/shows", {
        headers: {
            "Content-Type": "application/json",
            "trakt-api-key": TRAKT_API_KEY,
            "trakt-api-version": "2",
            "Authorization": `Bearer ${TRAKT_TOKEN}`
        }
    });

    return res.json();
}

function mapToMeta(items) {
    return items.map(item => {
        const show = item.show;
        const episode = item.episode;

        if (!show.ids.imdb) return null;

        return {
            id: show.ids.imdb,
            type: "series",
            name: `${show.title} - S${String(episode.season).padStart(2, "0")}E${String(episode.number).padStart(2, "0")}`
        };
    }).filter(Boolean);
}

builder.defineCatalogHandler(async ({ id }) => {
    if (id !== "trakt-calendar") return { metas: [] };

    try {
        let data = await getTraktCalendar();

        data = data
            .filter(item => item.show?.ids?.imdb)
            .sort((a, b) => new Date(a.first_aired) - new Date(b.first_aired))
            .slice(0, 20);

        const metas = mapToMeta(data);

        return { metas };
    } catch (err) {
        console.error(err);
        return { metas: [] };
    }
});

serveHTTP(builder.getInterface(), { port: PORT });

console.log("Addon running on port " + PORT);
