import { getIGDBEvents } from "./igdb";

export async function fetchMergedEvents() {
  const igdbEvents = await getIGDBEvents();

  const events = igdbEvents.map(event => ({
    id: event.id,
    title: event.name,
    description: event.description,
    streamUrl: event.live_stream_url,
    logo: event.event_logo ? `https://images.igdb.com/igdb/image/upload/t_720p/${event.event_logo.image_id}.png` : null,
    start: event.start_time ? new Date(event.start_time * 1000) : null,
    end: event.end_time ? new Date(event.end_time * 1000) : null,
    source: 'igdb'
  })).filter(e => e.start);

  return events.sort((a, b) => a.start - b.start);
}
