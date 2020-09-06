const fetchState = async (liveEventName, streamEndpoint) => {
  try {
    const before = Date.now();
    const fetchResponse = await fetch(`https://YOUR_FUNCTION_ENDPOINT.azurewebsites.net/api/stream/${encodeURIComponent(liveEventName)}?streamEndpoint=https://${streamEndpoint}`);
    const state = await fetchResponse.json();

    const totalTime = Date.now() - before;

    console.log(`[${liveEventName}] Got state in ${totalTime}ms`, state);

    return state;
  } catch(err) {
    return { error: err.message }
  }
}

const wait = (time) => new Promise(resolve => setTimeout(resolve, time));

const createSetTitleLabel = (el, room) => ({ loading = false, live = false, error }) => {
  let description = '';
  if (loading) {
    description = '...';
  } else if (error) {
    description = `: ${error}`;
  } else if (live) {
    description = ' (live)';
  } else {
    description = ' (offline)';
  }
  el.textContent = `${room}${description}`;
}

const run = async () => {
  const player = amp("azuremediaplayer", {
    nativeControlsForTouch: false,
    controls: true,
    autoplay: true,
    width: "100%",
    height: "100%",
    muted: true,
    // logo: { enabled: false }
  });

  
  const params = (new URL(location.href)).searchParams;

  const liveEventName = params.get('event');
  const displayName = params.get('name') || liveEventName;
  const streamEndpoint = params.get('endpoint');

  if (!liveEventName) {
    throw new Error('Event not set');
  }

  const offlineEl = document.getElementById('offline');
  const roomNameEl = document.getElementById('room-name');

  const setTitleLabel = createSetTitleLabel(roomNameEl, displayName);

  let currentStreamURL;

  do {
    setTitleLabel({ loading: true });

    const { error, streamURL, offlineReason } = await fetchState(liveEventName, streamEndpoint);

    if (error) {
      setTitleLabel({ error: error });
      await wait(30000);
      continue;
    }

    setTitleLabel({ live: !!streamURL });

    if (streamURL) {
      offlineEl.style.display = 'none';
      if (streamURL !== currentStreamURL) {
        player.src({
          src: streamURL,
          type: "application/vnd.ms-sstr+xml"
        });
      }
    } else {
      offlineEl.style.display = '';
      offlineEl.querySelector('small').textContent = `${liveEventName}: ${offlineReason}`;

      if (currentStreamURL) {
        if (player.isFullscreen()) {
          player.exitFullscreen();
        }

        player.pause();
      }
    }

    currentStreamURL = streamURL;

    const offset = 30000 + (Math.round(Math.random() * 10000) - 5000);


    console.log(`[${liveEventName}] Next in ${offset}ms`);

    await wait(offset);
  } while(true);

};

run().catch(err => console.error('Failed somewhere', err));
