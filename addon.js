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
