const BIRD_IMAGE_OVERRIDES ={
        "Merlin": "Merlin (bird)",
        "Rook": "Rook (bird)"
};


async function fetchWikiImage(title) {
    try {
            const r = await fetch('https://en.wikipedia.org/api/rest_v1/page/summary/' +
                encodeURIComponent(title.replace(/ /g, '_'))
            );
            if (!r.ok ) return null;
            const j = await r.json();
            if(j.type === 'disambiguation') return null;
            return (j.thumbnail && j.thumbnail.source) || null;
        } catch (e) {
            return null;
        }
    }

    const IMG_CONCURRENCY = 6;

    
    async function loadBirdImages(list = birds) {
        let cache = {};
        try { 
            const parsed = JSON.parse(localStorage.getItem('birdImgCache') || '{}'); 
            if (parsed && typeof parsed === 'object') cache = parsed;
        } catch (e) {}
        
        
        const missing = [];
        const queue = list.filter(b => !b.img);

        const worker = async () => {
            while (queue.length) {
                const b = queue.shift();
                const key = b.sci || b.n;
                if (cache[key]) { b.img = cache[key]; continue; }
            

            const candidates = [
                BIRD_IMAGE_OVERRIDES[b.n],
                b.sci,
                b.sci && b.sci.split(' ').slice(0, 2).join(' '),
                b.n + ' (bird)',
                b.n
            ].filter((t, i, a) => t && a.indexOf(t) === i);

            let found = false;
            for (const title of candidates) {
                const url = await fetchWikiImage(title);
                if (url) { b.img = url; cache[key] = url; found = true; break; }
            }
            
            if (!found) missing.push(b.n);
        }
    };

    await Promise.all(Array.from({ length: IMG_CONCURRENCY}, worker));

    try { localStorage.setItem('birdImgCache', JSON.stringify(cache)); } catch (e) {}
    if (missing.length) console.warn('No photo found for:', missing.join(', '));
}